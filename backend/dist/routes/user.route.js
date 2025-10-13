import { Router } from "express";
import { getMyProfile, getUserById, updateProfile, changePassword, deleteAccount, } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
export const userRouter = Router();
// protected
userRouter.get("/me", authMiddleware, getMyProfile);
userRouter.put("/update-profile", authMiddleware, updateProfile);
userRouter.put("/change-password", authMiddleware, changePassword);
userRouter.delete("/delete-account", authMiddleware, deleteAccount);
// public
userRouter.get("/:id", getUserById);
export default userRouter;
