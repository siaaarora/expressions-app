import dotenv from 'dotenv';
import { MongoClient } from "mongodb";

dotenv.config();

const Db = process.env.ATLAS_URL;
const client = new MongoClient(Db);

let db = null;

let conn;
try {
    conn = await client.connect();
    db = conn.db("boilerNow");
} catch(e) {
    console.error(e);
}

console.log("Connected to MongoDB!");

export default db;