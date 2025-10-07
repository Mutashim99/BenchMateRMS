import prisma from "../libs/prisma.js";
import bcrypt from "bcrypt";
import { bodyForEmailVerification } from "../utils/email.js";
import { emailQueue } from "../queues/email.queues.js";
import { generateToken } from "../utils/jwt.js";
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
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userFromDB = await prisma.user.findUnique({ where: { email } });
        if (!userFromDB) {
            return next({
                status: 404,
                message: `User not found`,
            });
        }
        const isPassCorrect = await bcrypt.compare(password, userFromDB.password);
        if (!isPassCorrect) {
            return next({ status: 400, message: "Incorrect password" });
        }
        if (!userFromDB.isEmailVerified) {
            return next({
                status: 400,
                message: "Email is not verified yet, you should verify your email before logging In!",
            });
        }
        //generates a new token
        const token = generateToken({ userId: userFromDB.id });
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).send({
            success: true,
            message: "Successfully logged in",
        });
    }
    catch (error) {
        next(error);
    }
};
//controller for sending email verification to user
export const resendEmailverification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const userFromDB = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!userFromDB) {
            return next({
                status: 404,
                message: "Cant find any registered user with the provided email",
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await prisma.emailVerification.update({
            where: {
                email,
            },
            data: {
                otp,
                expiresAt,
            },
        });
        const html = bodyForEmailVerification(otp);
        const subject = "Resend Request: Please Verify your email!";
        //async email sent to user without disrupting the api flow
        await emailQueue.add("sendVerificationEmail", {
            to: email,
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
        res.status(200).send({
            status: "success",
            message: "Succesfully sent verification email",
        });
    }
    catch (e) {
        next(e);
    }
};
//verify the user email via otp with this endpoint
export const verifyOTP = async (req, res, next) => {
    try {
        const { otp, email } = req.body;
        const userFromDB = await prisma.user.findUnique({ where: { email } });
        if (!userFromDB) {
            return next({ status: 400, message: "User not found" });
        }
        const otpRecord = await prisma.emailVerification.findUnique({
            where: { email },
        });
        if (!otpRecord) {
            return next({ status: 400, message: "No OTP found for this email" });
        }
        if (otpRecord.expiresAt < new Date()) {
            return next({ status: 400, message: "OTP has expired" });
        }
        if (otpRecord.otp !== otp) {
            return next({ status: 400, message: "Invalid OTP" });
        }
        await prisma.user.update({
            where: { email },
            data: { isEmailVerified: true },
        });
        await prisma.emailVerification.delete({ where: { email } });
        res.status(200).send({
            success: true,
            message: "Email verified successfully",
        });
    }
    catch (e) {
        next(e);
    }
};
//logout controller
export const logout = async (req, res, next) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.status(200).json({ message: "successfully logged out" });
    }
    catch (e) {
        next(e);
    }
};
