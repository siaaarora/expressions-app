import express from "express";
import fs from "fs";
import db from "../../conn.js";
import { ObjectId } from "mongodb";
import { allDataPresent } from "../../verif/endpoints.js";
import { sendNewPostEmail } from "../../emails/newPostEmail.js";
import { logEndpoint, logSuccess, logError } from "../../verif/logging.js"

const router = express.Router();
const newPostTemplate = fs.readFileSync("./routes/posts/dbTemplates/newPostTemplate.json", "utf8");
const newCommentTemplate = fs.readFileSync("./routes/posts/dbTemplates/newCommentTemplate.json", "utf8");
const newReplyTemplate = fs.readFileSync("./routes/posts/dbTemplates/newReplyTemplate.json", "utf8");

/*  
    Description: Get all posts
    Incoming data: None
    Outgoing data: 
        [
            {
                "postId": ObjectId,
                "title": string
                "content": string,
                "eventId": ObjectId,
                "postedDatetime": UTC Date,
                "likedBy": [ObjectId],
                "replies": [Object],
                "postAuthorName": string
            }
        ]
    On Success:
        - 200 : [Post Objects] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving all posts. -> There was a db error when trying to retrieve all posts.
*/
router.get('/', async (req, res) => {
    await logEndpoint(req, "Get all posts.");

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
        const results = await db.collection("users").aggregate([
            { $unwind: "$posts" },
            {
                $project: {
                    _id: 0,
                    "name": 1,
                    "posts": 1
                }
            },
            { $addFields: { "posts.postAuthorName": "$name" } },
            { $unset: "name" },
            { $replaceWith: "$posts" }
        ]).toArray();

        await logSuccess("Returned all posts.");
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving all posts.");
        res.status(500).send("Error retrieving all posts.");
    }
});

/*  
    Description: Get single post by postId
    Incoming data:
        params:
            postId: string | ObjectId
    Outgoing data: 
        {
            "postId": ObjectId,
            "title": string
            "content": string,
            "eventId": ObjectId,
            "postedDatetime": UTC Date,
            "likedBy": [ObjectId],
            "replies": [
                {
                    "replyId": ObjectId,
                    "content": string,
                    "authorId": ObjectId,
                    "postedDatetime": UTC Date,
                    "replies": [
                        {
                            "commentReplyId": ObjectId,
                            "content": string,
                            "authorId": ObjectId,
                            "postedDatetime": UTC Date,
                            "authorName": string
                        }
                    ],
                    "authorName": string
                }
            ],
            "postAuthorName": string
        }
    On Success:
        - 200 : Post object -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Post not found. -> The post id is not found in the db.
        - 500 : Error retrieving post. -> There was a db error when trying to retrieve the specific post.
*/
router.get('/post/:postId', async (req, res) => {
    await logEndpoint(req, "Get single post: " + (req.params.postId ?? ""));

    const inputDataCheck = allDataPresent(
        ["postId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const postId = new ObjectId(req.params.postId);

    try {
        const post = await db.collection("users").aggregate([
            { $unwind: "$posts" },
            { $match: { "posts.postId": postId } },
            {
                $project: {
                    _id: 0,
                    "name": 1,
                    "posts": 1
                }
            },
            { $addFields: { "posts.postAuthorName": "$name" } },
            { $unset: "name" },
            { $replaceWith: "$posts" },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "replies.authorId",
                    "foreignField": "_id",
                    "as": "repliesWithUserInfo"
                }
            },
            {
                "$addFields": {
                    "replies": {
                        "$map": {
                            "input": "$replies",
                            "as": "reply",
                            "in": {
                                "$mergeObjects": [
                                    "$$reply",
                                    {
                                        "authorName": {
                                            "$let": {
                                                "vars": {
                                                    "user": {
                                                        "$arrayElemAt": [
                                                            {
                                                                "$filter": {
                                                                    "input": "$repliesWithUserInfo",
                                                                    "as": "u",
                                                                    "cond": { "$eq": ["$$u._id", "$$reply.authorId"] }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    }
                                                },
                                                "in": "$$user.name"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "replies.replies.authorId",
                    "foreignField": "_id",
                    "as": "repliesWithUserInfo2"
                }
            },
            {
                "$addFields": {
                    "replies": {
                        "$map": {
                            "input": "$replies",
                            "as": "reply",
                            "in": {
                                "$mergeObjects": [
                                    "$$reply",
                                    {
                                        "replies": {
                                            "$map": {
                                                "input": "$$reply.replies",
                                                "as": "subReply",
                                                "in": {
                                                    "$mergeObjects": [
                                                        "$$subReply",
                                                        {
                                                            "authorName": {
                                                                "$let": {
                                                                    "vars": {
                                                                        "subUser": {
                                                                            "$arrayElemAt": [
                                                                                {
                                                                                    "$filter": {
                                                                                        "input": "$repliesWithUserInfo2",
                                                                                        "as": "su",
                                                                                        "cond": { "$eq": ["$$su._id", "$$subReply.authorId"] }
                                                                                    }
                                                                                },
                                                                                0
                                                                            ]
                                                                        }
                                                                    },
                                                                    "in": "$$subUser.name"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    "repliesWithUserInfo": 0,
                    "repliesWithUserInfo2": 0
                }
            },
        ]).toArray();

        if (!post) {
            await logError(404, `Post '${req.params.postId}' not found.`);
            return res.status(404).send("Post not found.");
        }

        await logSuccess("Returned post: " + req.params.postId);
        res.status(200).json(post[0]);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving the specific post.");
        res.status(500).send("Error retrieving the specific post.");
    }
});


/*  
    Description: Get all posts by one userId
    Incoming data:
        params:
            userId: string | ObjectId
    Outgoing data: 
        [
            {
                "postId": ObjectId,
                "title": string
                "content": string,
                "eventId": ObjectId,
                "postedDatetime": UTC Date,
                "likedBy": [ObjectId],
                "replies": [Object],
                "postAuthorName": string
            }
        ]
    On Success:
        - 200 : [Post Objects] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error retrieving all posts. -> There was a db error when trying to retrieve all posts.
*/
router.get('/:userId', async (req, res) => {
    await logEndpoint(req, "Get all posts by user: " + (req.params.userId ?? ""));

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
        const results = await db.collection("users").aggregate([
            { $match: { _id: userId } },
            { $unwind: "$posts" },
            {
                $project: {
                    _id: 0,
                    "name": 1,
                    "posts": 1
                }
            },
            { $addFields: { "posts.postAuthorName": "$name" } },
            { $unset: "name" },
            { $replaceWith: "$posts" }
        ]).toArray();

        await logSuccess("Returned all posts by user: " + req.params.userId);
        res.status(200).json(results)

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving all posts.");
        res.status(500).send("Error retrieving all posts.");
    }
});


/*  
    Description: Create new post
    Incoming data:
        params: 
            userId: string | ObjectId
        body: {
            "title": string,
            "content": string,
            "eventId": string | ObjectId
        }
    Outgoing data: None
    On Success:
        - 200 : Post published successfully with postId: <postId> -> Post was inserted into the user's document.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : UserId does not match an existing user. -> The userId is not found in the db.
        - 500 : Error publishing post. -> There was a db error when trying to insert the post.
*/
router.post('/create/:userId', async (req, res) => {
    await logEndpoint(req, "Create new post by user: " + (req.params.userId ?? ""));

    const inputDataCheck = allDataPresent(
        ["userId"],
        ["title", "content", "eventId"],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const userId = new ObjectId(req.params.userId);
    const title = req.body.title;
    const content = req.body.content;
    const eventId = new ObjectId(req.body.eventId);

    // Fill in data to post object
    const newPostObj = JSON.parse(newPostTemplate);
    newPostObj.postId = new ObjectId();
    newPostObj.title = title;
    newPostObj.content = content;
    newPostObj.eventId = eventId;
    newPostObj.postedDatetime = new Date();

    // TODO: If image:
    // newPostObj.image = image;

    // Insert post by modifying the user's document
    try {
        const results = await db.collection("users").updateOne(
            { _id: userId },
            { $push: { posts: newPostObj } }
        );

        if (results.matchedCount === 0) {
            await logError(404, `User '${req.params.userID}' not found.`);
            return res.status(404).send("UserId does not match an existing user.");
        }

        if (results.modifiedCount === 0) {
            throw new Error('Post was not published.');
        }

        console.log("Post published with postId: " + newPostObj.postId);
        await logSuccess("Post published with postId: " + newPostObj.postId);
        res.status(200).send('Post published successfully with id: ' + newPostObj.postId);

        sendNewPostEmail(newPostObj, userId);

    } catch (e) {
        console.log(e);
        await logError(500, "Error publishing post.");
        res.status(500).send('Error publishing post.');
    }
});


// Modify existing post
router.patch('/update', async (req, res) => {
    console.log("Edit existing post route called.");
    res.send("Edit existing post route called.");
    console.log();
});


/*  
    Description: Delete existing post
    Incoming data:
        params: 
            userId: string | ObjectId
            postId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : Post deleted successfully. -> Post was deleted from the user's document.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error deleting post. -> There was a db error when trying to delete the post.
*/
router.delete('/delete/:userId/:postId', async (req, res) => {
    await logEndpoint(req, `Delete post '${req.params.postId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
        ["userId", "postId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const userId = new ObjectId(req.params.userId);
    const postId = new ObjectId(req.params.postId);

    try {
        var results = await db.collection("users").updateOne(
            { _id: userId },
            { $pull: { posts: { postId: postId } } }
        );

        if (results.modifiedCount === 0) {
            throw new Error('Post was not deleted.');
        }

        await logSuccess(`Post '${req.params.postId}' by user '${req.params.userId}' was deleted.`)
        res.status(200).send('Post deleted successfully.');

    } catch (e) {
        console.log(e);
        await logError(500, "Error deleting post.");
        res.status(500).send("Error deleting post.");
    }
});

/*
    Description: Get all posts for a specific org
    Incoming data:
        params:
            orgId: string | ObjectId
    Outgoing data: 
        [
            {
                "postId": ObjectId,
                "title": string
                "content": string,
                "eventId": ObjectId,
                "postedDatetime": UTC Date,
                "likedBy": [ObjectId],
                "replies": [Object],
                "postAuthorName": string
            }
        ]
    On Success:
        - 200 : [Post Objects] -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Org not found. -> The given org id does not exist in the db.
        - 500 : Error retrieving all posts. -> There was a db error when trying to retrieve all posts.
*/
router.get('/orgPosts/:orgId', async (req, res) => {
    await logEndpoint(req, "Get all posts by org: " + (req.params.orgId ?? ""));

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
        var org = await db.collection("orgs").findOne({ _id: orgId });

        if (!org) {
            console.log("Org not found.");
            await logError(404, `Org '${req.params.orgId}' not found.`);
            return res.status(404).send("Org not found.");
        }

        var eventIds = org.events;

        const results = await db.collection("users").aggregate([
            { $unwind: "$posts" },
            {
                $match: {
                    "posts.eventId": { $in: eventIds } // Filters posts by eventIds in your list
                }
            },
            {
                $project: {
                    _id: 0,
                    "name": 1,
                    "posts": 1
                }
            },
            { $addFields: { "posts.postAuthorName": "$name" } },
            { $unset: "name" },
            { $replaceWith: "$posts" }
        ]).toArray();

        await logSuccess("Returned all posts by org: " + req.params.orgId);
        res.status(200).json(results);

    } catch (e) {
        console.log(e);
        await logError(500, "Error retrieving all posts.");
        res.status(500).send("Error retrieving all posts.");
    }
});

/*  
    Description: Like/Unlike a post by post-id
    Incoming data:
        params:
            postId: string | ObjectId
            userId: string | ObjectId
    Outgoing data: None
    On Success:
        - 200 : Array of type User Id -> Data will be sent following the Outgoing data structure.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 500 : Error liking/unliking the post. -> There was a db error when trying to like/unlike the specific post.
*/
router.patch('/like/:postId/:userId', async (req, res) => {
    await logEndpoint(req, `Like/unlike post '${req.params.postId ?? ""}' by user: ${req.params.userId ?? ""}`);

    const inputDataCheck = allDataPresent(
        ["postId", "userId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const postId = new ObjectId(req.params.postId);
    const userId = new ObjectId(req.params.userId);

    try {
        const results = await db.collection("users").findOne(
            { "posts.postId": postId },
            {
                projection: {
                    _id: 0,
                    "posts.$": 1
                }
            }
        );
        if (!results) {
            await logError(404, `Post '${req.params.postId}' not found.`);
            return res.status(404).send("Post not found.");
        }
        const post = results["posts"][0];

        const isLikedByUser = post.likedBy.some(id => id.toString() === userId.toString());
        if (isLikedByUser) {
            post.likedBy = post.likedBy.filter(id => !id.equals(userId));
        } else {
            post.likedBy.push(userId);
        }

        const updatedResults = db.collection("users").updateOne(
            { "posts.postId": postId },
            {
                $set: {
                    "posts.$.likedBy": post.likedBy
                }
            }
        );

        if (updatedResults.modifiedCount === 0) {
            throw new Error('Post Update Failed')
        }

        await logSuccess(`Post '${req.params.postId}' was liked/unliked by user: ${req.params.userId}`);
        res.status(200).json(post.likedBy);

    } catch (e) {
        console.log(e);
        await logError(500, "Error liking/unliking the post.");
        res.status(500).send("Error liking/unliking the post.");
    }
});

/*  
    Description: Add a comment to a post
    Incoming data:
        params:
            postId: string | ObjectId
            userId: string | ObjectId
        body:
            content: string 
    Outgoing data:
    On Success:
        - 200 : Comment was added to the post successfully.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Post with id <id> not found. -> The post is not found in the db.
        - 500 : Error adding comment to post. -> There was a db error when trying to add a comment.
*/
router.patch('/comment/:postId/:userId', async (req, res) => {
    await logEndpoint(req, `Add a comment to post '${req.params.postId ?? ""}' by user: ${req.params.userId}`);

    const inputDataCheck = allDataPresent(
        ["postId", "userId"],
        ["content"],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const newComment = JSON.parse(newCommentTemplate);
    newComment.replyId = new ObjectId();
    newComment.postedDatetime = new Date();
    newComment.content = req.body.content;
    newComment.authorId = new ObjectId(req.params.userId);

    const postId = new ObjectId(req.params.postId);

    try {
        const results = await db.collection("users").updateOne(
            { "posts.postId": postId },
            {
                $push: {
                    "posts.$.replies": newComment
                }
            }
        );
        if (results.matchedCount === 0) {
            await logError(404, `Post '${req.params.postId}' not found.`);
            res.status(404).send("Post with id " + postId + " not found.");
        } else {
            console.log("Comment added successfully with replyId: " + newComment.replyId);
            await logSuccess(`Comment by user '${req.params.userId}' was added to post '${req.params.postId}' with replyId: ${newComment.replyId}`);
            res.status(200).send("Comment added successfully with id: " + newComment.replyId);
        }
    } catch (e) {
        console.log(e);
        await logError(500, "Error adding a comment the post.");
        res.status(500).send("Error adding a comment the post.");
    }
});

/*  
    Description: Remove a comment from a post
    Incoming data:
        params:
            postId: string | ObjectId
            replyId: string | ObjectId 
    Outgoing data:
    On Success:
        - 200 : Comment was removed from the post successfully.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Post with id <id> not found. -> The post was not found in the db.
        - 404 : Comment with replyId <id> was not found. -> The comment was not found in the db.
        - 500 : Error removing comment from the post. -> There was a db error when trying to remove the comment.
*/
router.patch('/uncomment/:postId/:replyId', async (req, res) => {
    await logEndpoint(req, `Remove comment on post '${req.params.postId ?? ""}' with replyId: ${req.params.replyId}`);

    const inputDataCheck = allDataPresent(
        ["postId", "replyId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const postId = new ObjectId(req.params.postId);
    const replyId = new ObjectId(req.params.replyId);

    try {
        const results = await db.collection("users").updateOne(
            { "posts.postId": postId },
            {
                $pull: {
                    "posts.$.replies": { replyId: replyId }
                }
            }
        );
        if (results.matchedCount === 0) {
            await logError(404, `Post '${req.params.postId}' not found.`);
            res.status(404).send("Post with id " + postId + " not found.");
        } else if (results.modifiedCount === 0) {
            await logError(404, `Comment '${req.params.replyId}' not found.`);
            res.status(404).send("Comment with replyId " + replyId + " was not found.");
        } else {
            await logSuccess(`Comment '${req.params.replyId}' was removed from post: ${req.params.postId}`)
            res.status(200).send("Comment removed successfully");
        }
    } catch (e) {
        console.log(e);
        await logError(500, "Error removing the comment from the post.");
        res.status(500).send("Error removing the comment from the post.");
    }
});


/*  
    Description: Add a reply to a comment
    Incoming data:
        params:
            replyId: string | ObjectId
            userId: string | ObjectId
        body:
            content: string 
    Outgoing data:
    On Success:
        - 200 : Reply added successfully with id: <commentReplyId> -> The reply was added to the comment.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Comment with id <replyId> not found. -> The comment is not found in the db.
        - 500 : Error adding a reply to the comment. -> There was a db error when trying to add a reply.
*/
router.patch('/reply/:replyId/:userId', async (req, res) => {
    await logEndpoint(req, `Add a reply to comment '${req.params.replyId ?? ""}' by user: ${req.params.userId}`);

    const inputDataCheck = allDataPresent(
        ["replyId", "userId"],
        ["content"],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const replyId = new ObjectId(req.params.replyId);
    const userId = new ObjectId(req.params.userId);

    const newReply = JSON.parse(newReplyTemplate);
    newReply.commentReplyId = new ObjectId();
    newReply.postedDatetime = new Date();
    newReply.content = req.body.content;
    newReply.authorId = userId;

    try {
        const results = await db.collection("users").updateOne(
            { "posts.replies.replyId": replyId },
            { $push: { "posts.$[post].replies.$[reply].replies": newReply } },
            {
                arrayFilters: [
                    { "post.replies.replyId": replyId },
                    { "reply.replyId": replyId }
                ]
            }
        );

        if (results.matchedCount === 0) {
            await logError(404, `Comment '${req.params.replyId}' not found.`);
            res.status(404).send("Comment with id " + replyId + " not found.");
        } else {
            console.log("Reply added successfully with commentReplyId: " + newReply.commentReplyId);
            await logSuccess(`Reply by user '${req.params.userId}' was added to comment '${req.params.replyId}' with commentReplyId: ${newReply.commentReplyId}`);
            res.status(200).send("Reply added successfully with id: " + newReply.commentReplyId);
        }
    } catch (e) {
        console.log(e);
        await logError(500, "Error adding a reply to the comment.");
        res.status(500).send("Error adding a reply to the comment.");
    }
});


/*  
    Description: Remove a reply from a comment
    Incoming data:
        params:
            replyId: string | ObjectId
            commentReplyId: string | ObjectId 
    Outgoing data:
    On Success:
        - 200 : Comment reply was removed from the comment successfully.
    On Error:
        - 400 : <message> -> The incoming request does not contain the required data fields.
        - 404 : Comment with id <replyId> not found. -> The comment was not found in the db.
        - 404 : Comment reply with id <commentReplyId> was not found. -> The reply was not found in the db.
        - 500 : Error removing reply from the comment. -> There was a db error when trying to remove the reply.
*/
router.patch('/delete-comment-reply/:replyId/:commentReplyId', async (req, res) => {
    await logEndpoint(req, `Remove reply on comment '${req.params.replyId ?? ""}' with commentReplyId: ${req.params.replyId}`);

    const inputDataCheck = allDataPresent(
        ["replyId", "commentReplyId"],
        [],
        req
    );

    if (!inputDataCheck.correct) {
        await logError(400, inputDataCheck.message);
        return res.status(400).send(inputDataCheck.message);
    }

    const replyId = new ObjectId(req.params.replyId);
    const commentReplyId = new ObjectId(req.params.commentReplyId);

    try {
        const results = await db.collection("users").updateOne(
            { "posts.replies.replyId": replyId },
            { $pull: { "posts.$[post].replies.$[reply].replies": { "commentReplyId": commentReplyId } } },
            {
                arrayFilters: [
                    { "post.replies.replyId": replyId },
                    { "reply.replyId": replyId }
                ]
            }
        );

        if (results.matchedCount === 0) {
            await logError(404, `Comment '${req.params.replyId}' not found.`);
            res.status(404).send("Comment with id " + replyId + " not found.");
        } else if (results.modifiedCount === 0) {
            await logError(404, `Comment reply '${req.params.commentReplyId}' not found.`);
            res.status(404).send("Comment reply with commentReplyId " + commentReplyId + " was not found.");
        } else {
            await logSuccess(`Comment reply '${req.params.commentReplyId}' was removed from comment: ${req.params.replyId}`)
            res.status(200).send("Comment reply was removed from the comment successfully.");
        }

    } catch (e) {
        console.log(e);
        await logError(500, "Error removing the reply from the comment.");
        res.status(500).send("Error removing the reply from the comment.");
    }
});









export default router;