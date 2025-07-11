import jwt, { JwtPayload } from "jsonwebtoken";
import JWT_SECRET from "./config.js";

interface CustomJwtPayload extends JwtPayload {
    userId: string;
}

const authMiddleware = (req:any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ 
            success: false,
            message: "No authentication token provided" 
        });
        return;
    }
    
    const token = authHeader.split(" ")[1];
    
    if (!token) {
        res.status(401).json({ 
            success: false,
            message: "Invalid token format" 
        });
        return;
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as CustomJwtPayload
        
        if (decoded && decoded.userId) {
            req.userId = decoded.userId;
            next();
        } else {
            res.status(403).json({ 
                success: false,
                message: "Invalid token payload" 
            });
            return;
        }
    } catch (error: any) {

        if (error.name === "TokenExpiredError") {
            res.status(401).json({
                success: false,
                message: "Token expired"
            });
            return;

        } else if (error.name === "JsonWebTokenError") {
            res.status(401).json({
                success: false,
                message: "Invalid token"
            });
            return;

        } else {
            res.status(500).json({
                success: false,
                message: "Authentication error"
            });
            return;
        }
    }
};

export default authMiddleware;