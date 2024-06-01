import express from "express";
import db from "../../conn.js";
import md5 from "md5";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { logEndpoint, logSuccess, logError, logEmail } from "../../verif/logging.js";


const router = express.Router();

const transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: 'expressions2024@gmail.com',
		pass: process.env.APP_PASS,
	}
});


// POST Route for /forgotPassword
router.post("/forgotPassword", async function (req, res) {
    await logEndpoint(req, `Forgot password called by email: ${req.body.email ?? ""}`);

	const userEmail = req.body.email.toLowerCase();
	try {
		const user = await db.collection("users").findOne({ "login.email": userEmail })
        
        if (user) {
            const secret = process.env.JWT_SECRET + userExists.password;
            const payload = {
                email: userEmail
            };
            const token = jwt.sign(payload, secret, { expiresIn: '15m' });
            const link = `http://localhost:3000/reset-password?email=${encodeURIComponent(userEmail)}&token=${encodeURIComponent(token)}`;
            console.log(userEmail);
            const msg = {
                from: '"Team Expressions" expressions2024@gmail.com',
                to: userEmail,
                subject: 'Expressions Password Reset',
                text: `Hello from Expressions! Go Sundevils! Please click the link to reset your email:\n${link}.\n The link is only valid for 15 minutes.`
            }
            transporter.sendMail(msg, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            await logSuccess("Forgot Password link sent to: " + req.body.email);
            await logEmail("Forgot Password", [req.body.email]);
            console.log("Link Sent Successfuly! Check your inbox!");
        } else {
            console.log('User Not Found');
            await logError(500, `User '${req.body.email}' not found.`);
            res.status(500).send("User Not Found");
            // redirect
        }
	} catch (e) {
		console.log(e);
		res.status(500).send("Error fetching user");
		// redirect
	}
});


router.get("/reset-password/:email/:token", async function (req, res) {
	const email = req.params.email.toLowerCase();
    const token = req.params.token;
    try {
	    const user = await db.collection("users").findOne({ "login.email": email });

        if (user) {
            const secret = process.env.JWT_SECRET + user.password;
            try {
                jwt.verify(token, secret);
                console.log("Verified");
                // TODO: Render Reset Password with Email
                res.redirect(`http://localhost:3000/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);

            } catch (error) {
                console.log(error);
                console.log("Verification Failed");
                res.sendStatus(500);
            }
        } else {
            console.log('Invalid Link, verification failed.');
            res.sendStatus(500);
        }
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

router.post("/reset-password", async function (req, res) {
    await logEndpoint(req, "Reset password for email: " + (req.body.email ?? ""));
    const email = req.body.email.toLowerCase();
    const password = req.body.password;
    
    if (password.length < 6) {
        console.log("Password length is less than 6!");
        await logError(400, "Password length is less than 6!");
        res.status(400).send('Password length is less than 6!');
        return;
    }

    try {
        const updateResult = await db.collection("users").updateOne(
            { "login.email": email },
            { "$set": { "login.password": md5(password) } }
        );

        if (updateResult.matchedCount === 0) {
            await logError(404, `User with email '${email}' not found.`)
            res.status(404).send('User not found');
        } else {
            console.log('Updated Password');
            await logSuccess("Password updated for user: " + email);
			res.status(200)
		}
    } catch (err) {
        console.error(`Failed to update password: ${err}`);
        await logError("Failed to reset password.");
        res.status(500).send('Failed to update password');
    }
});


export default router;