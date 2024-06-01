import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import { Worker } from "worker_threads";
import "./conn.js";
import path from 'path';

// Routes
import userRouter from "./routes/users/users.js";
import googleOAuthRouter from "./routes/users/googleOAuth.js";
import forgotPasswordRouter from "./routes/users/forgotPassword.js";
import eventRouter from "./routes/events/events.js";
import postRouter from "./routes/posts/posts.js";
import orgRouter from "./routes/orgs/orgs.js";
import shareEventRouter from "./emails/shareEventEmail.js";
import statRouter from "./routes/stats/stats.js";
import reportOrgRouter from "./emails/reportOrgEmail.js";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// Connect routes
app.use('/', userRouter);
app.use('/', googleOAuthRouter);
app.use('/', forgotPasswordRouter);
app.use('/events', eventRouter);
app.use('/posts', postRouter);
app.use("/orgs", orgRouter);
app.use("/shareEvent", shareEventRouter);
app.use("/stats", statRouter);
app.use("/reportOrg", reportOrgRouter);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`Server is running on port: ${port}`);
});

// Schedule email task to check and send emails every 5 minutes. Occurs on separate thread to prevent server from slowing down
// cron.schedule('*/5 * * * *', () => {
//  	const worker = new Worker('./emails/eventReminderEmail.js');
// });