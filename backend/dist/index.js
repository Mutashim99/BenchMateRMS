import express from "express";
import "dotenv/config.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.route.js";
import "./workers/email.worker.js"; // for worker to run 
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use(errorHandler);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
