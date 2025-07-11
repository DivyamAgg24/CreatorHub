import express from "express";
import { z } from "zod";
import prisma from "@repo/db/client";
import authMiddleware from "./middleware";
import { GoogleGenAI } from '@google/genai';
import {SystemPrompt} from "./constant"
import * as dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Schema validation for idea creation and updates
const ideaSchema = z.object({
    title: z.string().min(1, "Title is required"),
    status: z.string().min(1, "Status is required"),
    tags: z.array(z.string()),
    content: z.array(z.any()), // Allowing any for Slate's Descendant[] type
    platformContent: z.any().optional()
});

// GET all ideas for the authenticated user
router.get("/getIdeas", authMiddleware, async (req: any, res) => {
    try {
        const ideaList = await prisma.idea.findMany({
            where: {
                userId: req.userId,
            },
            orderBy: {
                updatedAt: "desc", // Most recently updated first
            },
        });

        res.status(200).json({
            success: true,
            data: ideaList,
        });
        return
    } catch (error) {
        console.error("Error fetching ideas:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch ideas",
        });
        return
    }
});

router.post("/createIdea", authMiddleware, async (req: any, res) => {
    try {
        const validationResult = ideaSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Invalid idea data",
                errors: validationResult.error.errors,
            });
            return;
        }

        const { title, status, tags, content, platformContent } = validationResult.data;

        const newIdea = await prisma.idea.create({
            data: {
                title,
                status,
                tags,
                content, // Store Slate's content directly
                platformContent,
                userId: req.userId,
            },
        });

        res.status(201).json({
            success: true,
            data: newIdea,
        });
        return
    } catch (error) {
        console.error("Error creating idea:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create idea",
        });
        return
    }
});

const promptSchema = z.object({
    prompt: z.string().min(1, "Prompt is required")
})

router.post("/AIIdeaContent", authMiddleware, async (req: any, res: any) => {
    try {
        const validationResult = promptSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid prompt data",
                errors: validationResult.error.errors,
            });
        }

        const { prompt } = validationResult.data;

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Create Google Gemini AI instance
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY ,
        });

        const config = {
            responseMimeType: 'text/plain',
            systemInstruction: [
                {
                    text: SystemPrompt
                }
            ],
        };

        const model = 'gemini-2.0-flash';
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ];

        try {
            const response = await ai.models.generateContentStream({
                model,
                config,
                contents,
            });

            // Stream each chunk to the client
            for await (const chunk of response) {
                // Send the chunk as a Server-Sent Event
                if (chunk.text) {
                    console.log(chunk.text)
                    res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
                    // Flush the data immediately
                    if (res.flush) {
                        res.flush();
                    }
                }
            }

            // End the stream
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();

        } catch (aiError) {
            console.error("AI generation error:", aiError);
            res.write(`data: ${JSON.stringify({ error: "AI generation failed" })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error("Error in AI content generation:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to generate AI content",
            });
        } else {
            res.write(`data: ${JSON.stringify({ error: "Failed to generate AI content" })}\n\n`);
            res.end();
        }
    }
});

// PUT update an existing idea
router.put("/updateIdea/:id", authMiddleware, async (req: any, res) => {
    try {
        const { id } = req.params;
        const validationResult = ideaSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Invalid idea data",
                errors: validationResult.error.errors,
            });
            return
        }

        // First check if the idea exists and belongs to this user
        const existingIdea = await prisma.idea.findUnique({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!existingIdea) {
            res.status(404).json({
                success: false,
                message: "Idea not found or you don't have permission to update it",
            });
            return
        }

        const { title, status, tags, content, platformContent } = validationResult.data;

        const updatedIdea = await prisma.idea.update({
            where: {
                id,
            },
            data: {
                title,
                status,
                tags,
                content,
                platformContent,
                updatedAt: new Date(),
            },
        });

        res.status(200).json({
            success: true,
            data: updatedIdea,
        });
        return
    } catch (error) {
        console.error("Error updating idea:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update idea",
        });
        return
    }
});

// DELETE an idea
router.delete("/deleteIdea/:id", authMiddleware, async (req: any, res) => {
    try {
        const { id } = req.params;

        // Check if the idea exists and belongs to this user
        const existingIdea = await prisma.idea.findUnique({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!existingIdea) {
            res.status(404).json({
                success: false,
                message: "Idea not found or you don't have permission to delete it",
            });
            return;
        }

        await prisma.idea.delete({
            where: {
                id,
            },
        });

        res.status(200).json({
            success: true,
            message: "Idea deleted successfully",
        });
        return;
    } catch (error) {
        console.error("Error deleting idea:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete idea",
        });
        return;
    }
});

// Search ideas by term (searches in title, content, and tags)
router.get("/searchIdeas", authMiddleware, async (req: any, res) => {
    try {
        const { term } = req.query;

        if (!term || typeof term !== 'string') {
            res.status(400).json({
                success: false,
                message: "Search term is required",
            });
            return;
        }

        const ideas = await prisma.idea.findMany({
            where: {
                userId: req.userId,
                OR: [
                    { title: { contains: term, mode: 'insensitive' } },
                    { tags: { has: term } },
                    // Note: Searching in Slate content is complex and depends on your DB
                    // You might need a custom solution or full-text search for content
                ],
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        res.status(200).json({
            success: true,
            data: ideas,
        });
        return
    } catch (error) {
        console.error("Error searching ideas:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search ideas",
        });
        return
    }
});

export default router;

// AIzaSyAGXspPFiKkmicShhkyuGnUvqxuaWbBtKE