import prisma from "../libs/prisma.js";
import bcrypt from "bcrypt";
import { bodyForEmailVerification } from "../utils/email.js";
import { emailQueue } from "../queues/email.queues.js";
export const signUp = async (req, // first one is for req params,second for response body and third is for request body and fourth is for query params
res, next) => {
    try {
        const { name, email, password, major, institute } = req.body; //getting stuffs from body
        //some validation for signup
        if (password.length < 8) {
            return next({
                status: 400,
                message: "Password length must be longer than 8 characters!",
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (existingUser) {
            return next({ status: 400, message: "user already registered" });
        }
        //hashing password with salt=10 and creating user
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                institute,
                major,
            },
        });
        //sending email using bc jobs with otp and sending that otp info into EmailVerification Table in DB
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await prisma.emailVerification.create({
            data: {
                email, //in front end we will get this email by query param passed by registration page to verify otp type page
                otp,
                expiresAt,
            },
        });
        const html = bodyForEmailVerification(otp);
        const subject = "Please Verify your email!";
        //async email sent to user without disrupting the api flow
        await emailQueue.add("sendVerificationEmail", {
            to: createdUser.email,
            subject,
            html,
        }, {
            attempts: 1,
            backoff: {
                type: "fixed",
                delay: 10000,
            },
            removeOnComplete: true,
            removeOnFail: true,
        });
        console.log("Email job added to queue");
        // const mailSendInfo = await sendMail({
        //   to: createdUser.email,
        //   subject,
        //   html,
        // });
        // add the async email sending thing here maybe tomorrow or maybe no need here ig? cause adding that long thing just to send email i dont think makes sense
        res.status(201).send({
            success: true,
            message: "Signed Up succesfully",
            data: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                institute: createdUser.institute,
                major: createdUser.major,
                emailVerified: createdUser.isEmailVerified,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
