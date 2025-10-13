import { verifyToken } from "../utils/jwt.js";
export const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res
            .status(401)
            .json({ message: "Unauthorized - No token provided" });
    }
    try {
        const payload = verifyToken(token);
        req.user = { userId: payload.userId };
        next();
    }
    catch (err) {
        next({ status: 401, message: "Invalid token" });
    }
};
