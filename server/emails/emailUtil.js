import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	service: 'gmail',
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: 'expressions2024@gmail.com',
		pass: process.env.APP_PASS,
	}
});

const convertDateToEST = (date) => {
	const options = {
		timeZone: 'America/New_York',
		timeZoneName: 'short',
		hour12: true,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	};

	return new Date(date).toLocaleTimeString('en-US', options);
};

export {transporter, convertDateToEST};