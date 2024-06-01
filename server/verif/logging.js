import fs from "fs";
import { convertDateToEST } from "../emails/emailUtil.js";

const loggingFile = "./verif/logs.txt";

/* Adds backend endpoint to logging file */
const logEndpoint = async (req, message) => {
    try {
        const date = convertDateToEST(new Date());
        let logMessage = `[${date}] ${req.method} ${req.originalUrl} -> ${message}\n`;
        let fileHandle = await fs.promises.open(loggingFile, 'a');
        await fileHandle.appendFile(logMessage, 'utf8');
        await fileHandle.close();
    } catch (e) {
        console.log(e);
    }
};

/* Adds backend success to loggin file */
const logSuccess = async (message) => {
    try {
        const date = convertDateToEST(new Date());
        let logMessage = `[${date}] SUCCESS -> ${message}\n`;
        let fileHandle = await fs.promises.open(loggingFile, 'a');
        await fileHandle.appendFile(logMessage, 'utf8');
        await fileHandle.close();
    } catch (e) {
        console.log(e);
    }
}

/* Adds backend errors to logging file */
const logError = async (errorCode, message) => {
    try {
        const date = convertDateToEST(new Date());
        let logMessage = `[${date}] ${errorCode} ERROR -> ${message}\n`;
        let fileHandle = await fs.promises.open(loggingFile, 'a');
        await fileHandle.appendFile(logMessage, 'utf8');
        await fileHandle.close();
    } catch (e) {
        console.log(e);
    }
};

/* Adds email actions to loggin file */
const logEmail = async (emailType, recipients) => {
    try {
        const date = convertDateToEST(new Date());
        let logMessage = `[${date}] EMAIL: ${emailType} -> Email sent to: ${recipients.join(', ')}\n`;
        let fileHandle = await fs.promises.open(loggingFile, 'a');
        await fileHandle.appendFile(logMessage, 'utf8');
        await fileHandle.close();
    } catch (e) {
        console.log(e);
    }
};

export { logEndpoint, logSuccess, logError, logEmail };