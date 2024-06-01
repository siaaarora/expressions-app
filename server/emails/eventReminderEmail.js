import fs from "fs";
import db from "../conn.js"
import { transporter } from "./emailUtil.js";


const emailTemplate = fs.readFileSync("./emails/emailTemplates/eventReminderTemplate.html", "utf8");

async function checkEvents() {
    // Emails set to send 1 day +- 5 minutes before event starts. Milliseconds and seconds are ignored
    const currentDatetime = new Date();
    currentDatetime.setSeconds(0, 0);
    currentDatetime.setDate(currentDatetime.getDate() + 1);
    currentDatetime.setHours(currentDatetime.getHours() - 5);

    console.log(currentDatetime)

    const pipeline = [
        { 
            $addFields: {
                convertedDate: {
                    $toDate: "$eventStartDatetime"
                }
            }
        },
        {   // Filter events to only those occuring in the next ~ 1 day
            $match: {
                'convertedDate': {
                    $lte: new Date(currentDatetime.getTime() + (5 * 60000)),
                    $gt: new Date(currentDatetime.getTime() - (5 * 60000))
                }
            }
        },
        {   // Join with users collection to get list of users interested in each event
            $lookup: {
                from: 'users',
                localField: 'usersInterested',
                foreignField: '_id',
                as: 'joinedData'
            }
        },
        {
            $unwind: '$joinedData'
        },
        {   // Keep users that have event reminder email notifications on
            $match: {
                'joinedData.emailNotifs.upcomingEvents': true
            }
        },
        {
            $group: {
                _id: '$_id',
                eventTitle: {$first: '$title'},
                convertedDate: {$first: "$convertedDate"},
                //belongsToOrg: {$first: '$belongsToOrg'},
                usersInterested: {
                    $push: {
                        email: '$joinedData.login.email',
                        name: '$joinedData.name'
                    }
                }
            }
        },
        // // {   // Join with orgs collection to get event's org info
        // //     $lookup: {
        // //         from: 'orgs',
        // //         localField: 'belongsToOrg',
        // //         foreignField: '_id',
        // //         as: 'joinedData'
        // //     }
        // // },
        {   // Keep only certain entries
            $project: {
                _id: 0,
                eventTitle: 1,
                usersInterested: 1,
                convertedDate: 1,
                //'orgName': '$joinedData.name',
                //'orgShorthand': '$joinedData.shorthand'
            }
        }
    ];

    try {
        var results = await db.collection("events").aggregate(pipeline).toArray();

        console.log(results);
        
        // Loop through each event
        results.forEach(event => {
            console.log(event.usersInterested);
            // Loop through each user interested
            event.usersInterested.forEach( user => {
                sendEmail(event, user);
            });
        });
    } catch(e) {
        console.log(e);
    }
}

function sendEmail(event, user) {
    let email = user.email;
    let name = user.name;
    let date = new Date(event.convertedDate);
    date.setHours(date.getHours() + 5);

    let mailOptions = {
        from: '"Team Expressions" expressions2024@gmail.com',
        to: email,
        subject: `${event.eventTitle} is coming up!`,
        html: emailTemplate.replace("{{name}}", name)
                           .replace("{{eventTitle}}", event.eventTitle)
                           .replace("{{startTime}}", date)
    }
    
    // For testing purposes so I dont send an email on every run
    const sendEmail = true;
    if (sendEmail) {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.log(err);
            else console.log("Email sent: " + info.response);
        });
    }
}

await checkEvents();

