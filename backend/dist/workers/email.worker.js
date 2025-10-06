import { Worker } from "bullmq";
import 'dotenv/config.js';
import { sendMail } from "../utils/email.js";
import { connection } from "../queues/email.queues.js";
const redisURl = process.env.REDIS_URL;
redisURl ? console.log("redis url working") : console.log("cant get redis url");
// const connection = new IORedis(redisURl, {
//   maxRetriesPerRequest: 1,
//   enableReadyCheck: false,
// });
const worker = new Worker("emailQueue", async (job) => {
    const { to, subject, html } = job.data;
    console.log('Worker received job:', job.name, job.data);
    try {
        const result = await sendMail({ to, subject, html });
        console.log("Email sent:", result);
    }
    catch (error) {
        console.error("Error sending email:", error);
    }
}, { connection });
console.log("running the worker");
