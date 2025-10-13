import prisma from "../libs/prisma.js";
import bcrypt from "bcrypt";
import { emailQueue } from "../queues/email.queues.js";
/**
 * Request body DTOs (simple inline types)
 */
/**
 * GET /api/users/me
 * returns current logged-in user's public profile
 */
export const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next({ status: 401, message: "UnAuthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                institute: true,
                major: true,
                isEmailVerified: true,
                createdAt: true,
            },
        });
        if (!user)
            return next({ status: 404, message: "User not found" });
        res.status(200).json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
};
/**
 * GET /api/users/:id
 * public profile of another user (no sensitive data)
 */
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                institute: true,
                major: true,
                createdAt: true,
            },
        });
        if (!user)
            return next({ status: 404, message: "User not found" });
        res.status(200).json({ success: true, data: user });
    }
    catch (e) {
        next(e);
    }
};
/**
 * PUT /api/users/update-profile
 * body: { name?, institute?, major? }
 */
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next({ status: 401, message: "UnAuthorized" });
        }
        const { name, institute, major } = req.body;
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { name, institute, major },
            select: {
                id: true,
                name: true,
                email: true,
                institute: true,
                major: true,
            },
        });
        res
            .status(200)
            .json({ success: true, message: "Profile updated", data: updated });
    }
    catch (e) {
        next(e);
    }
};
/**
 * PUT /api/users/change-password
 * body: { oldPassword, newPassword }
 */
export const changePassword = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next({ status: 401, message: "UnAuthorized" });
        }
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            return next({ status: 400, message: "Old and new password required" });
        if (newPassword.length < 8)
            return next({
                status: 400,
                message: "New password must be at least 8 characters",
            });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return next({ status: 404, message: "User not found" });
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return next({ status: 400, message: "Incorrect old password" });
        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        if (user.email) {
            const html = "body will be added later";
            const subject = "ALERT: Your Account's password has been Changed";
            //async email sent to user without disrupting the api flow
            await emailQueue.add("sendVerificationEmail", {
                to: user.email,
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
        }
        res
            .status(200)
            .json({ success: true, message: "Password changed successfully" });
    }
    catch (e) {
        next(e);
    }
};
/**
 * DELETE /api/users/delete-account
 * deletes user's related data then the user
 */
export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return next({ status: 401, message: "UnAuthorized" });
        }
        // cleanup related records to avoid FK errors
        await prisma.comment.deleteMany({ where: { userId } });
        await prisma.hype.deleteMany({ where: { userId } });
        // delete resources uploaded by user (this also should trigger cascading deletes of comments/hypes via DB or handle them)
        await prisma.resource.deleteMany({ where: { uploaderId: userId } });
        // finally delete user
        await prisma.user.delete({ where: { id: userId } });
        // clear cookie if any
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res
            .status(200)
            .json({ success: true, message: "Account deleted successfully" });
    }
    catch (e) {
        next(e);
    }
};
