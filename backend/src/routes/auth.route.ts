import { Router } from "express";
import {
  signUp,
  login,
  logout,
  verifyOTP,
  resendEmailverification,
} from "../controller/auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/verify-otp", verifyOTP);
authRouter.post("/resend-verification-email", resendEmailverification);
