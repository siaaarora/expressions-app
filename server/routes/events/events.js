import express from "express";
import fs from "fs";
import db from "../../conn.js";
import { ObjectId } from "mongodb";
import multer from 'multer';
import { allDataPresent } from "../../verif/endpoints.js";
import { sendNewEventEmail } from "../../emails/newEventEmail.js";
import { logEndpoint, logSuccess, logError } from "../../verif/logging.js";

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const newEventTemplate = fs.readFileSync("./routes/events/dbTemplates/newEventTemplate.json", "utf8");

/*
    Description: Get all events
    Incoming data: None
    Outgoing data:
        [
            {
                "_id": string | ObjectId,
                "title": string,
                "description": string,
                "category": string,
                "location": string,
                "images": [string],
                "eventStartDatetime": UTC Date,
                "eventEndDatetime": UTC Date,
                "capacity": number,
                "usersInterested":
                    [
                        {
                            "userId": string | ObjectId,
                            "name": string
                        }
                    ],
                "visibility": string,
                "ageRequirement": number,
                "belongsToOrg": string | ObjectId, TODO: Will later be changed to also return org name
                "createdBy": string | ObjectId,
                "createdDatetime": UTC Date,
                "comments": [Object]
            }
        ]
    On Success:
        - 201 : [Event objects] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving events. -> There was a db error when trying to retrieve all the events.
*/
router.get('/', async (req, res) => {
    await logEndpoint(req, "Get all events");

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
        var results = await db.collection("events").find({}).toArray();

        await logSuccess("All events returned.")
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving events.");
        res.status(500).send("Error retrieving events.");
    }
});


/*
    Description: Create a new event
    Incoming data:
        body:
            {
                "title": string,
                "description": string,
                "eventStartDatetime": Local Date,
                "eventEndDatetime": Local Date,
                "category": string,
                "location": string,
                "capacity": string | number (optional),
                "visibility": string,
                "ageRequirement": number,
                "belongsToOrg": string | ObjectId,
                "createdBy": string | ObjectId,
                "createdByName": string
            }
        files:
            [
                {
                    "fieldname": string,
                    "originalname": strinbg,
                    "encoding": string,
                    "mimetype": string,
                    "destination": string,
                    "filename": string,
                    "path": string,
                    "size": number
                }
            ]
    Outgoing data: None
    On Success:
        - 201 : Successfully created the new event with id: <eventId> -> The event was successfully inserted into the db.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error creating new event. -> There was a db error when trying to create the new event.
*/
router.post('/create', upload.array('images'), async (req, res) => {
    await logEndpoint(req, "Create a new event. Created by: " + (req.body.createdBy ?? ""));

    const inputDataCheck = allDataPresent(
		[],
		["title", "description", "eventStartDatetime", "eventEndDatetime", "category", "location", "visibility", "ageRequirement", "belongsToOrg", "createdBy", "createdByName"],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}

    const title = req.body.title;
    const description = req.body.description;
    const eventStartDatetime = new Date(new Date(req.body.eventStartDatetime).toUTCString());
    const eventEndDatetime = new Date(new Date(req.body.eventEndDatetime).toUTCString());
    const category = req.body.category;
    const location = req.body.location;
    const capacity = +req.body.capacity || null;
    const visibility = req.body.visibility;
    const ageRequirement = +req.body.ageRequirement;
    const belongsToOrg = new ObjectId(req.body.belongsToOrg);
    const createdBy = new ObjectId(req.body.createdBy);
    const createdByName = req.body.createdByName;

    const newEventObj = JSON.parse(newEventTemplate);

    // Set event details
    newEventObj.title = title;
    newEventObj.description = description;
    newEventObj.category = category;
    newEventObj.location = location;
    if (req.files) {
        newEventObj.images = req.files.map(file => { return file.path; });
    }
    newEventObj.eventStartDatetime = eventStartDatetime;
    newEventObj.eventEndDatetime = eventEndDatetime;
    newEventObj.capacity = capacity;
    newEventObj.usersInterested = [{"userId": createdBy, "name": createdByName}];
    newEventObj.visibility = visibility;
    newEventObj.ageRequirement = ageRequirement;
    newEventObj.belongsToOrg = belongsToOrg;
    newEventObj.createdBy = createdBy;
    newEventObj.createdDatetime = new Date();

    try {
        const results = await db.collection("events").insertOne(newEventObj);

        const user = await db.collection("users").updateOne(
            { _id: createdBy },
            { 
                $push: { hostedEvents: results.insertedId },
                $addToSet: { interestedEventHistory: results.insertedId }
            }
        );

        const org = await db.collection("orgs").updateOne(
            { _id: belongsToOrg },
            { $addToSet: { events: results.insertedId } }
        );

        console.log("Created new event with _id: " + results.insertedId);
        await logSuccess("Created new event with _id: " + results.insertedId);
        res.status(201).send("Successfully created the new event with id: " + results.insertedId);

        sendNewEventEmail(newEventObj);

    } catch (e) {
        console.log(e);
        await logError(500, "Error creating new event.");
        res.status(500).send("Error creating new event.");
    }
});


/*
    Description: Get all events created by a user
    Incoming data:
        params:
            userId: string | ObjectId
    Outgoing data:
        [
            {
                "_id": string,
                "title": string,
                "category": string,
                "usersInterested":
                    [
                        {
                            "userId": string,
                            "name": string
                        }
                    ]
            }
        ]
    On Success:
        - 200 : {Array of partial event objects} -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving events. -> There was a db error when trying to retrieve the user's events.
*/
router.get('/user-events/:userId', async (req, res) => {
    await logEndpoint(req, "Get all events created by user: " + (req.params.userId ?? ""));

    const inputDataCheck = allDataPresent(
		["userId"],
		[],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}

    const userId = new ObjectId(req.params.userId);

    try {
        const events = await db.collection('events').find(
            { createdBy: userId },
            {
				projection: {
					_id: 1,
                    "title": 1,
                    "category": 1,
                    "usersInterested": 1
				}
			}
        ).toArray();

        await logSuccess("Returned all events created by a user.");
        res.status(200).json(events);
    } catch (e) {
        console.error(e);
        await logError(500, "Error retrieving events.");
        res.status(500).send('Error retrieving events.');
    }
});


/*
    Description: Update specific event
    Incoming data:
        params:
            eventId: string | ObjectId
        body: {
            "title": string,
            "description": string,
            "eventStartDatetime": Local Date,
            "eventEndDatetime": Local Date,
            "location": string,
            "category": string,
            "capacity": string | number (optional),
            "visibility": string,
            "ageRequirement": number
        }
    Outgoing data: None
    On Success:
        - 200 : Event updated successfully. -> The event was successfully updated in the db.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Event not found. -> The event with the given event id does not exist in the db.
        - 500 : Error updating event. -> There was a db error when trying to update the event.
*/
router.patch('/update/:eventId', async (req, res) => {
    await logEndpoint(req, "Update specific event: " + (req.params.eventId ?? ""));

    const inputDataCheck = allDataPresent(
		["eventId"],
		["title", "description", "eventStartDatetime", "eventEndDatetime", "location", "capacity", "category", "visibility", "ageRequirement"],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}

    const eventId = new ObjectId(req.params.eventId);
    const title = req.body.title;
    const description = req.body.description;
    const eventStartDatetime = new Date(new Date(req.body.eventStartDatetime).toUTCString());
    const eventEndDatetime = new Date(new Date(req.body.eventEndDatetime).toUTCString());
    const location = req.body.location;
    const category = req.body.category;
    const capacity = +req.body.capacity || null;
    const visibility = req.body.visibility;
    const ageRequirement = +req.body.ageRequirement;

    // Set event details
    const eventData = {
        "title": title,
        "description": description,
        "eventStartDatetime": eventStartDatetime,
        "eventEndDatetime": eventEndDatetime,
        "location": location,
        "category": category,
        "capacity": capacity,
        "visibility": visibility,
        "ageRequirement": ageRequirement
    };

    try {   
        const updateResult = await db.collection('events').updateOne(
            { _id: eventId },
            { $set: eventData }
        );
    
        if (updateResult.matchedCount === 0) {
            await logError(404, `Event '${req.params.eventId}' not found.`);
            return res.status(404).send('Event not found.');
        }
    
        if (updateResult.modifiedCount === 0) {
            throw new Error();
        }
    
        await logSuccess(`Event '${req.params.eventId}' updated successfully.`);
        res.status(200).send('Event updated successfully.');

    } catch (e) {
        console.log(e);
        await logError(500, "Error updating event.");
        res.status(500).send('Error updating event.');
    }
});


/*
    Description: Delete specific event
    Incoming data:
        params:
            eventId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : Event deleted. -> The event was successfully deleted from the db.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Event not found. -> The event with the given event id does not exist in the db.
        - 500 : Error deleting event. -> There was a db error when trying to delete the event.
*/
router.delete('/delete/:eventId', async (req, res) => {
    await logEndpoint(req, "Delete event: " + (req.params.eventId ?? ""));

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
        var result = await db.collection("events").deleteOne({ _id: eventId });

        // TODO: Remove event from all users' interestedEventHistory field

        if (result.deletedCount === 1) {
            console.log("Event deleted.");
            await logSuccess(`Event '${req.params.eventId}' deleted.`);
            return res.status(200).send("Event deleted.");
        } else {
            console.log("Couldn't find event to delete.");
            await logError(404, `Event '${req.params.eventId}' not found.`);
            return res.status(404).send("Event not found.");
        }
            
    } catch (e) {
        console.log(e);
        await logError(500, "Error deleting event.");
        res.status(500).send("Error deleting event.");
    }    
});


/*
    Description: Get specific event
    Incoming data:
        params:
            eventId: string | ObjectId
    Outgoing data:
        {
            "_id": string | ObjectId,
            "title": string,
            "description": string,
            "category": string,
            "location": string,
            "images": [string],
            "eventStartDatetime": UTC Date,
            "eventEndDatetime": UTC Date,
            "capacity": number | null,
            "usersInterested":
                [
                    {
                        "userId": string | ObjectId,
                        "name": string
                    }
                ],
            "visibility": string,
            "ageRequirement": number,
            "belongsToOrg": string | ObjectId, TODO: Will later be changed to also return org name
            "createdBy": string | ObjectId,
            "createdDatetime": UTC Date,
            "comments": [Object]
        }
    On Success:
        - 200 : JSON object containing the event data -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Event not found. -> The event with the given event id does not exist in the db.
        - 500 : Error retrieving event. -> There was a db error when trying to retrieve the event.
*/
router.get('/:eventId', async (req, res) => {
    await logEndpoint(req, "Get specific event: " + (req.params.eventId ?? ""));

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
        var results = await db.collection("events").findOne({ _id: eventId });

        if (!results) {
            console.log("Event not found.");
            await logError(404, `Event '${req.params.eventId}' not found.`);
            return res.status(404).send("Event not found.");
        }

        if (results.images.length != 0) {
            results.images.map(image => `http://localhost:8000/uploads/${image.replace('uploads\\', '')}`);
        }
        
        await logSuccess("Returned event data for: " + req.params.eventId);
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving event.");
        res.status(500).send("Error retrieving event.");
    }
})


/*
    Description: Follow an event
    Incoming data:
        params:
            eventId: string | ObjectId,
            userId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : User is now following the event. -> The user has been added to the event's interested list and the user's event history list.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : User not found. -> The user with the given user id does not exist in the db.
        - 404 : Event not found. -> The event with the given event id does not exist in the db.
        - 500 : Error following event. -> There was a db error when trying to follow the event.
*/
router.patch('/follow/:eventId/:userId', async (req, res) => {
    await logEndpoint(req, `Follow an event '${req.params.eventId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
		["eventId", "userId"],
		[],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}

    const eventId = new ObjectId(req.params.eventId);
    const userId = new ObjectId(req.params.userId);

    try {
        const updateUser = await db.collection('users').updateOne(
            { _id: userId },
            { $addToSet: { interestedEventHistory: eventId } }
        );

        if (updateUser.matchedCount === 0) {
            console.log("User not found.");
            await logError(404, `User '${req.params.userId}' not found.`);
            return res.status(404).send('User not found.');
        }

        const user = await db.collection('users').findOne(
            { _id: userId },
            { projection: { "name": 1 } }
        );

        const result = await db.collection('events').updateOne(
            { _id: eventId },
            {
                $addToSet: {
                    usersInterested: {
                        "userId": userId,
                        "name": user.name
                    }
                }
            }
        );

        if (result.matchedCount === 0) {
            console.log("Event not found.");
            await logError(404, `Event '${req.params.eventId}' not found.`);
            return res.status(404).send('Event not found.');
        }

        if (result.modifiedCount === 0) {
            throw new Error("User is already following this event.");
        }

        await logSuccess(`User '${req.params.userId}' is now following event: ${req.params.eventId}.`);
        res.status(200).send('User is now following the event.');

    } catch (e) {
        console.error(e);
        await logError(500, "Error following event.");
        res.status(500).send('Error following event.');
    }
});


/*
    Description: Unfollow an event
    Incoming data:
        params:
            eventId: string | ObjectId,
            userId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : User is no longer following the event. -> The user has been removed from the event's interested list and the user's event history list.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : User not found. -> The user with the given user id does not exist in the db.
        - 404 : Event not found. -> The event with the given event id does not exist in the db.
        - 500 : Error unfollowing from event. -> There was a db error when trying to unfollow the event.
*/
router.patch('/unfollow/:eventId/:userId', async (req, res) => {
    await logEndpoint(req, `Unfollow an event '${req.params.eventId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
		["eventId", "userId"],
		[],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}

    const eventId = new ObjectId(req.params.eventId);
    const userId = new ObjectId(req.params.userId);

    try {
        const updateUser = await db.collection('users').updateOne(
            { _id: userId },
            { $pull: { interestedEventHistory: eventId } }
        );

        if (updateUser.matchedCount === 0) {
            console.log("User not found.");
            await logError(404, `User '${req.params.userId}' not found.`);
            return res.status(404).send('User not found.');
        }

        const result = await db.collection('events').updateOne(
            { _id: eventId },
            { $pull: { usersInterested: { "userId": userId } } }
        );

        if (result.matchedCount === 0) {
            console.log("Event not found.");
            await logError(404, `Event '${req.params.eventId}' not found.`);
            return res.status(404).send('Event not found.');
        }

        if (result.modifiedCount === 0) {
            throw new Error("User was not following the event.");
        }

        await logSuccess(`User '${req.params.userId}' is no longer following event: ${req.params.eventId}.`);
        res.status(200).send('User is no longer following the event.');

    } catch (e) {
        console.error(e);
        await logError(500, "Error unfollowing from event.");
        res.status(500).send('Error unfollowing from event.');
    }
});


export default router;