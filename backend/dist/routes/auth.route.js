import { Router } from "express";
import { signUp } from "../controller/auth.controller.js";
export const authRouter = Router();
authRouter.post("/signup", signUp);
