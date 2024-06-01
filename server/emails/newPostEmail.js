import fs from "fs";
import db from "../conn.js"
import { transporter, convertDateToEST } from "./emailUtil.js";
import { logError, logEmail } from "../verif/logging.js";

const emailTemplate = fs.readFileSync("./emails/emailTemplates/newPostTemplate.html", "utf8");

const sendNewPostEmail = async (postObj, userId) => {
    try {
        const event = await db.collection("events").findOne({ "_id": postObj.eventId});
        const poster = await db.collection("users").findOne({ "_id": userId});
        const users = await db.collection("users").find({ 
            interestedEventHistory: { $elemMatch: { $eq: postObj.eventId } },
            "emailNotifs.newPostForEvent": true 
        },).toArray();

        let listOfEmails = [];

        users.forEach(user => {
            let email = user.login.email;
            listOfEmails.push(email);
            let mailOptions = {
                from: '"Team Expressions" expressions2024@gmail.com',
                to: email,
                subject: `${poster.name} had a new post!`,
                html: emailTemplate.replace("{{posterName}}", poster.name)
                                .replace("{{title}}", postObj.title)
                                .replace("{{content}}", postObj.content)
                                .replace("{{event}}", event.title)
                                .replace("{{time}}", convertDateToEST(postObj.postedDatetime))
            };
            transporter.sendMail(mailOptions);
            console.log("New post email sent to: " + email);
        });

        await logEmail("New Post", listOfEmails);

    } catch (e) {
        console.log("Error sending new post emails.")
        await logError(500, "Error sending new post emails.");
        console.log(e);
    }
};


export { sendNewPostEmail };