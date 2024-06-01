import express from "express";
import fs from "fs";
import db from "../../conn.js";
import { ObjectId } from "mongodb";
import multer from 'multer';
import { allDataPresent } from "../../verif/endpoints.js";
import { logEndpoint, logSuccess, logError } from "../../verif/logging.js";

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const newOrgTemplate = fs.readFileSync("./routes/orgs/dbTemplates/newOrgTemplate.json", "utf8");

/*
    Description: Get all orgs
    Incoming data: None
    Outgoing data:
        [
            {
                "name": string,
                "shorthand": string,
                "orgImg": string,
                "bannerImg": string,
                "bio": string,
                "contactInfo": {
                    "email": string,
                    "twitter": string,
                    "discord": string,
                    "phoneNumber": string
                },
                "ratings": [
                    {
                        "ratedBy": ObjectId
                        "rating": number
                    }
                ],
                "owner": ObjectId,
                "contributors": [ObjectId],
                "lastActive": UTC Date,
                "followers": [ObjectId],
                "events": [ObjectId],
                "dateCreated": UTC Date
            }
        ]
    On Success:
        - 200 : [Org data] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving orgs. -> There was a db error when trying to retrieve the orgs.
*/
router.get('/', async (req, res) => {
    await logEndpoint(req, "Get all orgs.");

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
        var results = await db.collection("orgs").find({}).toArray();

        results.forEach((org) => {
            if (org.orgImg != "") {
                org.orgImg = `http://localhost:8000/uploads/${org.orgImg.replace('uploads\\', '')}`
            }
            if (org.bannerImg != "") {
                org.bannerImg = `http://localhost:8000/uploads/${org.bannerImg.replace('uploads\\', '')}`
            }
        });

        await logSuccess("All orgs returned.");
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving orgs.");
        res.status(500).send("Error retrieving orgs.");
    }
});

/*
    Description: Get specific org
    Incoming data:
        params:
            orgId: string | ObjectId
    Outgoing data:
        {
            "name": string,
            "shorthand": string,
            "orgImg": string,
            "bannerImg": string,
            "bio": string,
            "contactInfo": {
                "email": string,
                "twitter": string,
                "discord": string,
                "phoneNumber": string
            },
            "ratings": [
                {
                    "ratedBy": ObjectId
                    "rating": number
                }
            ],
            "owner": string | ObjectId,
            "contributors": [ObjectId],
            "lastActive": UTC Date,
            "followers": [{
                "userId": ObjectID,
                "name": string
            }],
            "events": [Event Objects],
            "dateCreated": UTC Date
        }
    On Success:
        - 200 : JSON object containing the org data -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Org not found. -> The org with the given org id does not exist in the db.
        - 500 : Error retrieving org. -> There was a db error when trying to retrieve the org.
*/
router.get('/:orgId', async (req, res) => {
    await logEndpoint(req, "Get specific org: "+ (req.params.orgId ?? ""));

    const inputDataCheck = allDataPresent(
        ["orgId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const orgId = new ObjectId(req.params.orgId);

    try {
        var results = await db.collection("orgs").aggregate([
            { $match: { "_id": orgId } },
            {
                $lookup: {
                    from: "events",
                    localField: "events",
                    foreignField: "_id",
                    as: "events"
                }
            },
            {
                $addFields: {
                    events: "$events"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "followers",
                    foreignField: "_id",
                    as: "followers"
                }
            },
            {
                $addFields: {
                    followers: {
                        $map: {
                            input: "$followers",
                            as: "follower",
                            in: {
                                userId: "$$follower._id",
                                name: "$$follower.name"
                            }
                        }
                    }
                }
            }
        ]).toArray();

        if (!results || results.length < 1) {
            console.log("Org not found.");
            await logError(404, `Org '${req.params.orgId}' not found.`);
            return res.status(404).send("Org not found.");
        }

        results = results[0];

        if (results.orgImg != "") {
            results.orgImg = `http://localhost:8000/uploads/${results.orgImg.replace('uploads\\', '')}`
        }
        if (results.bannerImg != "") {
            results.bannerImg = `http://localhost:8000/uploads/${results.bannerImg.replace('uploads\\', '')}`
        }
        
        await logSuccess("Returned org: " + req.params.orgId);
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving org.");
        res.status(500).send("Error retrieving org.");
    }
});


/*  
    Description: Create new org
    Incoming data:
        body:
            {
                "createdBy": string | ObjectId,
                "name": string,
                "shorthand": string,
                "bio": string,
                "email": string,
                "twitter": string (optional),
                "discord": string (optional),
                "phoneNumber": string (optional)
            }
    Outgoing data: None
    On Success:
        - 201 : Successfuly created the new org. -> The org was added to the db.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error creating new org. -> There was a db error when trying to create the org.
*/
router.post('/create', upload.fields([{ name: 'orgImg', maxCount: 1 }, { name: 'bannerImg', maxCount: 1 }]), async (req, res) => {
    await logEndpoint(req, "Create new org. Created by: " + (req.body.createdBy ?? ""));
    const inputDataCheck = allDataPresent(
        [],
        ["createdBy", "name", "shorthand", "bio", "email"],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const userId = new ObjectId(req.body.createdBy);
    const name = req.body.name;
    const shorthand = req.body.shorthand;
    const bio = req.body.bio;
    const email = req.body.email;
    const twitter = req.body.twitter || "";
    const discord = req.body.discord || "";
    const phoneNumber = req.body.phoneNumber || "";
    let orgImgPath = "";
    let bannerImgPath = "";
    if (req.files) {
        orgImgPath = req.files['orgImg'] ? req.files['orgImg'][0].path : "";
        bannerImgPath = req.files['bannerImg'] ? req.files['bannerImg'][0].path : "";
    }

    const newOrgObj = JSON.parse(newOrgTemplate);

    // Set Org details
    newOrgObj.name = name;
    newOrgObj.shorthand = shorthand;
    newOrgObj.bio = bio;
    newOrgObj.orgImg = orgImgPath;
    newOrgObj.bannerImg = bannerImgPath;
    newOrgObj.contactInfo.email = email;
    newOrgObj.contactInfo.twitter = twitter;
    newOrgObj.contactInfo.discord = discord;
    newOrgObj.contactInfo.phoneNumber = phoneNumber;
    newOrgObj.owner = userId;
    newOrgObj.followers = [userId];
    newOrgObj.lastActive = new Date();
    newOrgObj.dateCreated = new Date();

    try {
        const results = await db.collection("orgs").insertOne(newOrgObj);

        const user = await db.collection("users").updateOne(
            { _id: userId },
            { $addToSet: { followingOrgs: results.insertedId } }
        );

        console.log("Created new org with _id: " + results.insertedId);
        await logSuccess("Created new org with _id: " + results.insertedId);
        res.status(201).send(results.insertedId);

    } catch (e) {
        console.log(e);
        await logEndpoint(500, "Error creating new org.");
        res.status(500).send("Error creating new org.");
    }
});


/*  
    Description: Update existing org
    Incoming data:
        params:
            orgId: string | ObjectId
        body:
            {
                "name": string,
                "shorthand": string,
                "bio": string,
                "email": string,
                "twitter": string (optional),
                "discord": string (optional),
                "phoneNumber": string (optional),
                "owner": string | ObjectId
            }
    Outgoing data: None
    On Success:
        - 200 : Org updated successfully. -> The org was successfully updated in the db.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error updating org. -> There was a db error when trying to update the org.
*/
router.patch('/update/:orgId', upload.fields([{ name: 'orgImg', maxCount: 1 }, { name: 'bannerImg', maxCount: 1 }]), async (req, res) => {
    await logEndpoint(req, "Update exiting org: " + (req.params.orgId ?? ""));

    const inputDataCheck = allDataPresent(
        ["orgId"],
        ["name", "shorthand", "bio", "email", "owner"],
        req
    );
  
    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }
  
    const orgId = new ObjectId(req.params.orgId);
    const name = req.body.name;
    const shorthand = req.body.shorthand;
    const bio = req.body.bio;
    const owner = new ObjectId(req.body.owner);
    const email = req.body.email;
    const twitter = req.body.twitter || "";
    const discord = req.body.discord || "";
    const phoneNumber = req.body.phoneNumber || "";
    const orgImgPath = req.files && req.files['orgImg'] ? req.files['orgImg'][0].path : "";
    const bannerImgPath = req.files && req.files['bannerImg'] ? req.files['bannerImg'][0].path : "";
  
    // Set org details
    const orgData = {
      "name": name,
      "shorthand": shorthand,
      "bio": bio,
      "contactInfo": {
        "email": email,
        "twitter": twitter,
        "discord": discord,
        "phoneNumber": phoneNumber
      },
      "owner": owner,
      "lastActive": new Date()
    };
  
    if (orgImgPath) {
        orgData.orgImg = orgImgPath;
    }
  
    if (bannerImgPath) {
        orgData.bannerImg = bannerImgPath;
    }
  
    try {
        const updateResult = await db.collection('orgs').updateOne(
            { _id: orgId },
            { $set: orgData }
        );
  
        if (updateResult.matchedCount === 0) {
            await logError(404, `Org '${req.params.orgId}' not found.`);
            return res.status(404).send('Org not found.');
        }
  
        if (updateResult.modifiedCount === 0) {
            throw new Error();
        }

        await logSuccess(`Org '${req.params.orgId}' updated.`);
        res.status(200).send('Org updated successfully.');
  
    } catch (e) {
        console.log(e);
        await logError(500, "Error updating org.");
        res.status(500).send('Error updating org.');
    }
});


/*
    Description: Delete org
    Incoming data:
        params:
            orgId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : Org deleted. -> The org was successfully deleted from the db and removed from users' followingOrgs.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Org not found. -> The org with the given org id does not exist in the db.
        - 500 : Error deleting Org. -> There was a db error when trying to delete the org.
*/
router.delete('/delete/:orgId', async (req, res) => {
    await logEndpoint(req, "Delete org: " + (req.params.orgId ?? ""));
    const inputDataCheck = allDataPresent(
		["orgId"],
		[],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}
    
    const orgId = new ObjectId(req.params.orgId);
    
    try {        
        
        var members = await db.collection("orgs").findOne(
            { _id: orgId },
            { 
                projection: {
                    owner: 1,
                    contributors: 1,
                    followers: 1
                } 
            }
        );

        if (!members) {
            console.log("Couldn't find org to delete.");
            await logError(404, `Couldn't find org '${req.params.orgId}' to delete.`);
            return res.status(404).send("Org not found.");
        }
        
        let followerIds = [members.owner.toString()];
        members.contributors.forEach( (id) => { followerIds.push(id.toString()); });
        members.followers.forEach( (id) => { followerIds.push(id.toString()); });
        followerIds = [...new Set(followerIds)].map(id => new ObjectId(id));

        var result = await db.collection("orgs").deleteOne({ _id: orgId });

        var updateUser = await db.collection("users").updateMany(
            { _id: { $in: followerIds } },
            { $pull: { followingOrgs: orgId } }
        );

        console.log("Org deleted.");
        await logSuccess("Deleted org: " + req.params.orgId);
        res.status(200).send("Org deleted.");
  
    } catch (e) {
        console.log(e);
        await logError(500, "Error deleting org.");
        res.status(500).send("Error deleting org.");
    }
});


/*
    Description: Get list of org members
    Incoming data:
        params:
            orgId: string | ObjectId
    Outgoing data:
        [
            {
                "name": string
            }
        ]
    On Success:
        - 200 : [JSON object with name of org members] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Org not found. -> The org with the given org id does not exist in the db.
        - 500 : Error retrieving members. -> There was a db error when trying to retrieve the org's members.
*/
router.get('/members/:orgId', async (req, res) => {
    await logEndpoint(req, "Get list of members in org: " + (req.params.orgId ?? ""));
    const inputDataCheck = allDataPresent(
        ["orgId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const orgId = new ObjectId(req.params.orgId);

    try {
        var members = await db.collection("orgs").findOne(
            { _id: orgId },
            { 
                projection: {
                    owner: 1,
                    contributors: 1,
                    followers: 1
                } 
            }
        );

        if (!members) {
            console.log("Couldn't find org to delete.");
            await logError(404, `Org '${req.params.orgId}' not found.`);
            return res.status(404).send("Org not found.");
        }

        let followerIds = [members.owner.toString()];
        members.contributors.forEach( (id) => { followerIds.push(id.toString()); });
        members.followers.forEach( (id) => { followerIds.push(id.toString()); });
        followerIds = [...new Set(followerIds)].map(id => new ObjectId(id));
        
        var userObjects = await db.collection("users").find(
            { _id: { $in: followerIds } },
            {
                projection: {
                    _id: 0,
                    name: 1
                }
            }
        ).toArray();

        await logSuccess("Returned list of members in org: " + req.params.orgId);
        res.status(200).json(userObjects);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving members.");
        res.status(500).send("Error retrieving members.");
    }
});


/*
    Description: Follow an org
    Incoming data:
        params:
            orgId: string | ObjectId,
            userId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : User is now following the org. -> The user has been added to the org's followers list and the user's following orgs list.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : User not found. -> The user with the given user id does not exist in the db.
        - 404 : Org not found. -> The org with the given org id does not exist in the db.
        - 500 : Error following org. -> There was a db error when trying to follow the org.
*/
router.patch('/follow/:orgId/:userId', async (req, res) => {
    await logEndpoint(req, `Follow an org '${req.params.orgId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
        ["orgId", "userId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const orgId = new ObjectId(req.params.orgId);
    const userId = new ObjectId(req.params.userId);

    try {
        const updateUser = await db.collection('users').updateOne(
            { _id: userId },
            { $addToSet: { followingOrgs: orgId } }
        );

        if (updateUser.matchedCount === 0) {
            console.log("User not found.");
            await logError(404, `User '${req.params.userId}' not found.`);
            return res.status(404).send('User not found.');
        }

        const result = await db.collection('orgs').updateOne(
            { _id: orgId },
            { $addToSet: { followers: userId } }
        );

        if (result.matchedCount === 0) {
            console.log("Org not found.");
            await logError(404, `Org '${req.params.orgId}' not found.`);
            return res.status(404).send('Org not found.');
        }

        if (result.modifiedCount === 0) {
            throw new Error("User is already following this org.");
        }

        await logSuccess(`User '${req.params.userId}' is now following org: ${req.params.orgId}`);
        res.status(200).send('User is now following the org.');
    } catch (e) {
        console.log(e);
        await logError(500, "Error following org.");
        res.status(500).send('Error following org.');
    }
});


/*
    Description: Unfollow an org
    Incoming data:
        params:
            orgId: string | ObjectId,
            userId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : User is no longer following the org. -> The user has been removed from the org's followers list and the user's following orgs list.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : User not found. -> The user with the given user id does not exist in the db.
        - 404 : Org not found. -> The org with the given org id does not exist in the db.
        - 500 : Error unfollowing from org. -> There was a db error when trying to unfollow the org.
*/
router.patch('/unfollow/:orgId/:userId', async (req, res) => {
    await logEndpoint(req, `Unfollow an org '${req.params.orgId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
		["orgId", "userId"],
		[],
        req
	);

	if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
		return res.status(400).send(inputDataCheck.message);
	}

    const orgId = new ObjectId(req.params.orgId);
    const userId = new ObjectId(req.params.userId);

    try {
        const updateUser = await db.collection('users').updateOne(
            { _id: userId },
            { $pull: { followingOrgs: orgId } }
        );

        if (updateUser.matchedCount === 0) {
            console.log("User not found.");
            await logError(404, `User '${req.params.userId}' not found.`);
            return res.status(404).send('User not found.');
        }

        const result = await db.collection('orgs').updateOne(
            { _id: orgId },
            { $pull: { followers: userId } }
        );

        if (result.matchedCount === 0) {
            console.log("Org not found.");
            await logError(404, `Org '${req.params.orgId}' not found.`);
            return res.status(404).send('Org not found.');
        }

        if (result.modifiedCount === 0) {
            throw new Error("User was not following the org.");
        }

        await logSuccess(`User '${req.params.userId}' is no longer following org: ${req.params.orgId}`);
        res.status(200).send('User is no longer following the org.');

    } catch (e) {
        console.error(e);
        await logError(500, "Error unfollowing org.");
        res.status(500).send('Error unfollowing from org.');
    }
});

/*
    Description: Get orgs the user is an owner of
    Incoming data:
        params:
            userId: string | ObjectId
    Outgoing data:
        [
            {
                "name": string,
                "shorthand": string,
                "orgImg": string,
                "bannerImg": string,
                "bio": string,
                "contactInfo": {
                    "email": string,
                    "twitter": string,
                    "discord": string,
                    "phoneNumber": string
                },
                "ratings": [
                    {
                        "ratedBy": ObjectId
                        "rating": number
                    }
                ],
                "owner": string | ObjectId,
                "contributors": [ObjectId],
                "lastActive": UTC Date,
                "followers": [ObjectId],
                "events": [ObjectId],
                "dateCreated": UTC Date
            }
        ]
    On Success:
        - 200 : [Org data] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving list of orgs. -> There was a db error when trying to retrieve the orgs the user is an owner of.
*/
router.get('/owner/:userId', async (req, res) => {
    await logEndpoint(req, `Get orgs the user '${req.params.userId ?? ""}' is an owner of.`);

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
        var results = await db.collection("orgs").find({ owner: userId }).toArray();

        results.forEach((org) => {
            if (org.orgImg != "") {
                org.orgImg = `http://localhost:8000/uploads/${org.orgImg.replace('uploads\\', '')}`
            }
            if (org.bannerImg != "") {
                org.bannerImg = `http://localhost:8000/uploads/${org.orgImg.replace('uploads\\', '')}`
            }
        });
        
        await logSuccess("Returned all orgs owned by user: " + req.params.userId);
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving list of orgs.");
        res.status(500).send("Error retrieving list of orgs.");
    }
});

/*
    Description: Get orgs the user is a follower of
    Incoming data:
        params:
            userId: string | ObjectId
    Outgoing data:
        [
            {
                "name": string,
                "shorthand": string,
                "orgImg": string,
                "bannerImg": string,
                "bio": string,
                "contactInfo": {
                    "email": string,
                    "twitter": string,
                    "discord": string,
                    "phoneNumber": string
                },
                "ratings": [
                    {
                        "ratedBy": ObjectId
                        "rating": number
                    }
                ],
                "owner": string | ObjectId,
                "contributors": [ObjectId],
                "lastActive": UTC Date,
                "followers": [ObjectId],
                "events": [ObjectId],
                "dateCreated": UTC Date
            }
        ]
    On Success:
        - 200 : [Org data] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving list of orgs. -> There was a db error when trying to retrieve the orgs the user is a member of.
*/
router.get('/following/:userId', async (req, res) => {
    await logEndpoint(req, `Get orgs followed by user: ${req.params.userId ?? ""}`);

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
        var results = await db.collection("orgs").find({ followers: { $in: [userId] } }).toArray();

        await logSuccess("Returned all orgs followed by user: " + req.params.userId);
        res.status(200).json(results);
    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving list of orgs.");
        res.status(500).send("Error retrieving list of orgs.");
    }
});

/*
    Description: Rate an org
    Incoming data:
        params:
            orgId: string | ObjectId,
            userId: string | ObjectId
        body:
            value: integer
    Outgoing data: None
    On Success:
        - 200 : User's rating has been added to the org.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error rating an org. -> There was a db error when trying to rate the org.
*/
router.patch('/rate/:orgId/:userId', async (req, res) => {
    await logEndpoint(req, `Org '${req.params.orgId ?? ""}' rated by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
        ["orgId", "userId"],
        ["value"],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const orgId = new ObjectId(req.params.orgId);
    const userId = new ObjectId(req.params.userId);
    const ratingValue = +parseFloat(req.body.value).toFixed(1);

    if (ratingValue > 5.0 || ratingValue < 1.0) {
        await logError(500, `Rating '${ratingValue}' by user '${req.params.userId}' for org '${req.params.orgId}' is out of bounds.`);
        return res.status(500).json('Rating Out of Bound');
    }
    
    try {
        let result = await db.collection("orgs").updateOne(
            {
                "_id": orgId, 
                "ratings": { 
                    "$elemMatch": { "ratedBy": userId } 
                }
            },
            {
                "$set": {
                    "ratings.$.value": ratingValue
                }
            }
        );
        // Step 2: If no document was updated, insert a new rating
        if (result.matchedCount === 0) {
            await db.collection("orgs").updateOne(
                { "_id": orgId },
                {
                    "$push": {
                        "ratings": { 
                            "ratedBy": userId,
                            "value": ratingValue
                        }
                    }
                }
            );
        }

        await logSuccess(`Org '${req.params.orgId}' was rated by user '${req.params.userId}' with a rating of: ${ratingValue}`);
        res.status(200).json('Updated Rating');
    } catch (e) {
        console.error(e);
        await logError(500, "Error rating an org.");
        res.status(500).send('Error rating an org.');
    }
});

/*
    Description: Unrate an org
    Incoming data:
        params:
            orgId: string | ObjectId,
            userId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : User's rating has been removed from the org.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error unrating an org. -> There was a db error when trying to unrate the org.
*/
router.patch('/unrate/:orgId/:userId', async (req, res) => {
    await logEndpoint(req, `Remove rating for org '${req.params.orgId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
        ["orgId", "userId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const orgId = new ObjectId(req.params.orgId);
    const userId = new ObjectId(req.params.userId);
    try {
        let result = await db.collection("orgs").updateOne(
            {
                "_id": orgId,
                "ratings": {
                    "$elemMatch": { "ratedBy": userId }
                }
            },
            {
                "$pull": { "ratings": { "ratedBy": userId } }
            }
        );

        if (result.modifiedCount === 0) {
            console.log('No User Rating Found for user id ' + userId);
            await logError(500, `User '${req.params.userId}' does not have a rating for org: ${req.params.orgId}`);
            res.status(500).json('No User Rating Found');
        } else {
            await logSuccess(`Rating for org '${req.params.orgId}' was removed by user: ${req.params.userId}`);
            res.status(200).json('Removed Rating');
        }

        
    } catch (e) {
        console.error(e);
        await logError(500, "Error removing rating for the org.");
        res.status(500).send('Error removing rating for the org.');
    }
});

export default router;