import db from "../conn.js";
import fs from "fs";

// Booleans to control which schema to update
const updateEventsSchema = false;
const updateOrgsSchema = false;
const updateUsersSchema = false;


// Update schema for "events" collection
if (updateEventsSchema) {
    const eventsSchema = JSON.parse(fs.readFileSync("./dbSchemas/eventsCollection.json", "utf8"));
    try {
        await db.command({
            collMod: "events",
            validator: {
                $jsonSchema: eventsSchema
            },
            //validationLevel: "off"
            validationLevel: "strict"
        });
        console.log("Successfully updated \"events\" collection schema.");
    } catch (e) {
        console.log(e);
    }
}


// Update schema for "orgs" collection
if (updateOrgsSchema) {
    const orgsSchema = JSON.parse(fs.readFileSync("./dbSchemas/orgsCollection.json", "utf8"));
    try {
        await db.command({
            collMod: "orgs",
            validator: {
                $jsonSchema: orgsSchema
            },
            // validationLevel: "off"
            validationLevel: "strict"
        });
        console.log("Successfully updated \"orgs\" collection schema.");
    } catch (e) {
        console.log(e);
    }
}


// Update schema for "users" collection
if (updateUsersSchema) {
    const usersSchema = JSON.parse(fs.readFileSync("./dbSchemas/usersCollection.json", "utf8"));
    try {
        await db.command({
            collMod: "users",
            validator: {
                $jsonSchema: usersSchema
            },
            // validationLevel: "off"
            validationLevel: "strict"
        });
        console.log("Successfully updated \"users\" collection schema.");
    } catch (e) {
        console.log(e);
    }
}


// Used for clearing the collections
const deleteEvent = false;
const deleteOrgs = false;
const deleteUsers = false;


if (deleteEvent) {
    await db.collection("events").deleteMany({});
    console.log("Deleted all events.");
}

if (deleteOrgs) {
    await db.collection("orgs").deleteMany({});
    console.log("Deleted all orgs.");
}

if (deleteUsers) {
    await db.collection("users").deleteMany({});
    console.log("Deleted all users.");
}

process.exit(1);