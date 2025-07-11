import express from "express";
import z from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "@repo/db/client";
import JWT_SECRET from "./config.js";

const router = express.Router();

const signupBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
});

router.post("/register", async (req, res) => {
    try {
        
        const validation = signupBody.safeParse(req.body);

        if (!validation.success) {
            res.status(411).json({
                message: "Incorrect input format",
                errors: validation.error.format()
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: req.body.email
            }
        });

        if (existingUser) {
            res.status(409).json({
                message: "Email already taken"
            });
            return;
        }

        // Hash the password before storing
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const user = await prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            }
        });

        const token = jwt.sign(
            {
                userId: user.id,
                userEmail: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        req.headers.authorization = token;

        res.status(201).json({
            message: "User created successfully",
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
        return;

    } catch (error: any) {
        console.error("Registration error:", error);

        if (error.code === 'P2002') {
            res.status(409).json({
                message: "Email already exists"
            });
            return;
        }

        res.status(500).json({
            message: "Server error while processing registration"
        });
        return;
    }
});

const loginBody = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post("/login", async (req, res) => {
    try {

        const validation = loginBody.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: "Incorrect inputs",
                errors: validation.error.format()
            })
            return;
        }

        // Find user by email only
        const userFound = await prisma.user.findUnique({
            where: {
                email: req.body.email
            }
        });

        if (!userFound) {
            res.status(401).json({
                message: "Invalid email or password"
            });
            return;
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(req.body.password, userFound.password);

        if (!isPasswordValid) {
            res.status(401).json({
                message: "Invalid email or password"
            });
            return;
        }

        const token = jwt.sign(
            {
                userId: userFound.id,
                userEmail: userFound.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        req.headers.authorization = token

        res.json({
            success: true,
            token: token,
            user: {
                id: userFound.id,
                email: userFound.email,
                name: userFound.name
            }
        });
        return;

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Server error while processing login"
        });
        return;
    }
});

export default router;