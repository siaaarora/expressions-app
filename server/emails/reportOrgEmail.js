import fs from "fs";
import db from "../conn.js"
import express from "express";
import { ObjectId } from "mongodb";
import { transporter, convertDateToEST } from "./emailUtil.js";
import { allDataPresent } from "../verif/endpoints.js";
import { logEndpoint, logSuccess, logError, logEmail } from "../verif/logging.js";

const router = express.Router();
const adminEmailTemplate = fs.readFileSync("./emails/emailTemplates/reportOrgAdminTemplate.html", "utf8");
const orgEmailTemplate = fs.readFileSync("./emails/emailTemplates/reportOrgTemplate.html", "utf8");

/*
    Description: Report an organization through email to Expressions and Org Owner
    Incoming data:
        params:
            userId: string | ObjectId
            orgId: string | ObjectId
        body: {
            "reason": string
        }
    Outgoing data: None
    On Success:
        - 200 : Org reported. -> The org was reported to the BoilerNow account and Org Owner as well as the reporter were notified.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : User or org not found. -> The userId or orgId was not found in the db.
        - 500 : Error reporting org. -> There was an error when reporting the org.
*/
router.post('/:userId/:orgId', async (req, res) => {
    await logEndpoint(req, `User '${req.params.userId ?? ""} wants to report org: ${req.params.orgId ?? ""}`);

    const inputDataCheck = allDataPresent(
        ["userId", "orgId"],
        ["reason"],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const userId = new ObjectId(req.params.userId);
    const orgId = new ObjectId(req.params.orgId);
    const reportReason = req.body.reason;

    try {
        const user = await db.collection("users").findOne({ "_id": userId});
        const org = await db.collection("orgs").findOne({ "_id": orgId}); 

        if (!user || !org) {
            await logError(404, `User '${req.params.userId}' or org '${req.params.orgId}' not found.`);
            return res.status(404).send("User or Org not found.");
        }

        const orgOwner = await db.collection("users").findOne({ "_id": org.owner});
        const reportTime = convertDateToEST(new Date());
        
        const adminMailOptions = {
            from: '"Team Expressions" expressions2024@gmail.com',
            to: 'expressions2024@gmail.com',
            subject: `Organization Reported!`,
            html: adminEmailTemplate.replace("{{reporterName}}", user.name)
                            .replace("{{reporterEmail}}", user.login.email)
                            .replace("{{time}}", reportTime)
                            .replace("{{reason}}", reportReason)
                            .replace("{{name}}", org.name)
                            .replace("{{owner}}", orgOwner.name)
        };

        const orgMailOptions = {
            from: '"Team Expressions" expressions2024@gmail.com',
            to: orgOwner.login.email,
            subject: `Your Organization Was Reported!`,
            html: orgEmailTemplate.replace("{{name}}", org.name)
                            .replace("{{time}}", reportTime)
                            .replace("{{reason}}", reportReason) 
        };
        
        await transporter.sendMail(adminMailOptions);
        await logEmail("Report Org Admin Copy", ["expressions2024@gmail.com"]);
        await transporter.sendMail(orgMailOptions);
        await logEmail("Report Org Org Copy", [orgOwner.login.email]);
        
        console.log("Report email sent to: expressions2024@gmail.com, " + orgOwner.login.email);
        await logSuccess(`The org '${req.params.orgId}' was reported by user: ${req.params.userId}`);
        res.status(200).send("Org Report Email Shared.");

    } catch (e) {
        console.error(e);
        await logError(500, "Error reporting org.");
        res.status(500).send('Error reporting org.');
    }
});

export default router;