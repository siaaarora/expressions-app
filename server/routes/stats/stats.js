import express from "express";
import db from "../../conn.js";
import { ObjectId } from "mongodb";
import { allDataPresent } from "../../verif/endpoints.js";
import { logEndpoint, logSuccess, logError } from "../../verif/logging.js";

const router = express.Router();


/*
    Description: Get stats for users, events, and orgs
    Incoming data: None
    Outgoing data:
        {
            "events": {
                "totalEventCnt": number,
                "publicCnt": number,
                "privateCnt": number,
                "academicCnt": number,
                "socialCnt": number,
                "otherCnt": number,
                "futureCnt": number,
                "pastCnt": number,
                "avgUsersInterestedCnt": number,
                "avgCommentCnt": number,
            },
            "users": {
                "totalUserCnt": number,
                "avgHostedEventsCnt": number,
                "avgEventsInterestedCnt": number,
                "avgFollowingOrgsCnt": number,
                "avgPostCnt": number,
                "totalPostCnt": number
            },
            "org": {
                "totalOrgCnt": number,
                "orgsWithDiscordCnt": number,
                "orgsWithTwitterCnt": number,
                "orgsWithPhoneNumberCnt": number,
                "avgNonNullRating": number | null,
                "avgContributorCnt": number,
                "avgFollowerCnt": number,
                "avgEventCnt": number
            }
        }
    On Success:
        - 200 : JSON Object containing user, event, and org stats -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving stats. -> There was a db error when trying to retrieve stats.
*/
router.get('/', async (req, res) => {
    await logEndpoint(req, "Get stats for users, events, and orgs.");

    const inputDataCheck = allDataPresent(
        [],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    try {
        var users = await db.collection("users").find({}).toArray();
        var events = await db.collection("events").find({}).toArray();
        var orgs = await db.collection("orgs").find({}).toArray();

        let eventStats = {
            "totalEventCnt": 0,
            "publicCnt": 0,
            "privateCnt": 0,
            "academicCnt": 0,
            "socialCnt": 0,
            "otherCnt": 0,
            "futureCnt": 0,
            "pastCnt": 0,
            "avgUsersInterestedCnt": 0,
            "avgCommentCnt": 0,
        };

        events.forEach((event) => {
            eventStats.totalEventCnt += 1;
            if (event.visibility === "Public") eventStats.publicCnt += 1;
            else if (event.visibility === "Private") eventStats.privateCnt += 1;
            if (event.category === "Academic") eventStats.academicCnt += 1;
            else if (event.category === "Social") eventStats.socialCnt += 1;
            else if (event.category === "Other") eventStats.otherCnt += 1;
            if (event.eventStartDatetime >= new Date()) eventStats.futureCnt += 1;
            else if (event.eventStartDatetime < new Date()) eventStats.pastCnt += 1;
            eventStats.avgUsersInterestedCnt += event.usersInterested.length;
            eventStats.avgCommentCnt += event.comments.length;
        });

        if (eventStats.totalEventCnt != 0) {
            eventStats.avgUsersInterestedCnt /= eventStats.totalEventCnt;
            eventStats.avgCommentCnt /= eventStats.totalEventCnt;
        }

        let userStats = {
            "totalUserCnt": 0,
            "avgHostedEventsCnt": 0,
            "avgEventsInterestedCnt": 0,
            "avgFollowingOrgsCnt": 0,
            "avgPostCnt": 0,
            "totalPostCnt": 0
        };

        users.forEach((user) => {
            userStats.totalUserCnt += 1;
            userStats.avgHostedEventsCnt += user.hostedEvents.length;
            userStats.avgEventsInterestedCnt += user.interestedEventHistory.length;
            userStats.avgFollowingOrgsCnt += user.followingOrgs.length;
            userStats.avgPostCnt += user.posts.length;
            userStats.totalPostCnt += user.posts.length;
        });

        if (userStats.totalUserCnt != 0) {
            userStats.avgHostedEventsCnt /= userStats.totalUserCnt;
            userStats.avgEventsInterestedCnt /= userStats.totalUserCnt;
            userStats.avgFollowingOrgsCnt /= userStats.totalUserCnt;
            userStats.avgPostCnt /= userStats.totalUserCnt;
        }

        let orgStats = {
            "totalOrgCnt": 0,
            "orgsWithDiscordCnt": 0,
            "orgsWithTwitterCnt": 0,
            "orgsWithPhoneNumberCnt": 0,
            "avgNonNullRating": 0,
            "avgContributorCnt": 0,
            "avgFollowerCnt": 0,
            "avgEventCnt": 0
        };

        let nonNullRatingCnt = 0;

        orgs.forEach((org) => {
            orgStats.totalOrgCnt += 1;
            if (org.contactInfo.discord != "") orgStats.orgsWithDiscordCnt += 1;
            if (org.contactInfo.twitter != "") orgStats.orgsWithTwitterCnt += 1;
            if (org.contactInfo.phoneNumber != "") orgStats.orgsWithPhoneNumberCnt += 1;
            org.ratings.forEach((rating) => {
                orgStats.avgNonNullRating += rating;
                nonNullRatingCnt += 1;
            });
            orgStats.avgContributorCnt += org.contributors.length;
            orgStats.avgFollowerCnt += org.followers.length;
            orgStats.avgEventCnt += org.events.length;
        });

        if (orgStats.totalOrgCnt != 0) {
            orgStats.avgContributorCnt /= orgStats.totalOrgCnt;
            orgStats.avgFollowerCnt /= orgStats.totalOrgCnt;
            orgStats.avgEventCnt /= orgStats.totalOrgCnt;
        }

        if (nonNullRatingCnt != 0) {
            orgStats.avgNonNullRating /= nonNullRatingCnt;
        } else {
            orgStats.avgNonNullRating = null;
        }


        const stats = {
            "events": eventStats,
            "users": userStats,
            "orgs": orgStats
        };

        await logSuccess("Returned stats for users, events, and orgs.");
        res.status(200).json(stats);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving stats.");
        res.status(500).send("Error retrieving stats.");
    }
});

/*
    Description: Get stats for specific event
    Incoming data:
        params:
            eventId: string | ObjectId
    Outgoing data:
        {
            "visibility": string,
            "category": string,
            "imgCnt": number,
            "usedCapacityPct": string,
            "avgUsersInterestedCnt": number,
            "avgCommentCnt": number,
        }
    On Success:
        - 200 : JSON Object containing stats data for the given event -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Event not found. -> The event with the given event id does not exist in the db.
        - 500 : Error retrieving stats. -> There was a db error when trying to retrieve stats.
*/
router.get('/event/:eventId', async (req, res) => {
    await logEndpoint(req, "Get stats for event: " + (req.params.eventId ?? ""));

    const inputDataCheck = allDataPresent(
        ["eventId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const eventId = new ObjectId(req.params.eventId);

    try {
        var event = await db.collection("events").findOne({ _id: eventId });

        if (!event) {
            console.log("Event not found.");
            await logError(404, `Event '${req.params.eventId}' not found.`);
            return res.status(404).send("Event not found.");
        }

        let eventStats = {
            "visibility": "",
            "category": "",
            "imgCnt": 0,
            "usedCapacityPct": "",
            "usersInterestedCnt": 0,
            "commentCnt": 0,
        };

        eventStats.visibility = event.visibility;
        eventStats.category = event.category;
        eventStats.imgCnt = event.images.length;
        eventStats.usedCapacityPct = ((event.usersInterested.length / event.capacity) * 100).toFixed(2) + "%";
        eventStats.usersInterestedCnt += event.usersInterested.length;
        eventStats.commentCnt += event.comments.length;

        await logSuccess("Returned stats for event: " + req.params.eventId);
        res.status(200).json(eventStats);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving stats.");
        res.status(500).send("Error retrieving stats.");
    }
});


export default router;