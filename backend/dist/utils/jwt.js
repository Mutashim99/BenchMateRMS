import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
export const generateToken = (payload) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d', });
    return token;
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (e) {
        throw new Error("Invalid token");
    }
};
