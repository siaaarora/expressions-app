import express from "express";
import db from "../../conn.js";
import fs from "fs";
import passport from 'passport';
import OAuth from 'passport-google-oauth20';
import session from "express-session";


const router = express.Router();
const newUserTemplate = fs.readFileSync("./routes/users/dbTemplates/newUserTemplate.json", "utf8");
const GoogleStrategy = OAuth.Strategy;

router.use(
	session({
		secret: "TOPSECRETWORD",
		resave: false,
		saveUninitialized: true,
	})
);

router.use(passport.initialize());
router.use(passport.session());


router.get("/auth/google",
	passport.authenticate('google', { scope: ["profile", "email"] })
);


router.get("/auth/google/expressions",
	passport.authenticate('google', { failureRedirect: "http://localhost:8000/login" }),
	function (req, res, err) {
		const user = req.user;
		res.redirect("http://localhost:3000/profile?user=" + user._id);
});


passport.use(
	"google",
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:8000/auth/google/expressions",
			userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
		},
		async (accessToken, refreshToken, profile, cb) => {
			try {
				console.log("Google login: " + profile);
				const newUserObj = JSON.parse(newUserTemplate);

				// Set user details
				newUserObj.login.email = profile.emails[0].value.toLowerCase();
				newUserObj.login.googleId = profile.id;
				newUserObj.login.password = "notrequired";
				newUserObj.login.isAsuEmail = newUserObj.login.email.endsWith("@asu.edu");
				newUserObj.name = profile.displayName;
				newUserObj.age = 25; // TODO: Needs to be changed to calculate age from Google profile's dob
				newUserObj.createdDatetime = new Date();
				console.log(newUserObj);

				const user = await db.collection("users").findOne({ "login.email": newUserObj.login.email });
				if (user) {
					console.log('User already exists');
					return cb(null, user);
				}

				// Insert new document to users collection
				const newUser = await db.collection("users").insertOne(newUserObj);
				console.log("Inserted new user with _id: " + newUser.insertedId);
				return cb(null, newUser);
			} catch (err) {
				console.log(err);
				return cb(err);
			}
		}
	)
);


passport.serializeUser((user, cb) => {
	cb(null, user);
});

passport.deserializeUser((user, cb) => {
	cb(null, user);
});


export default router;