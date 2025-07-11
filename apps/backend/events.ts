import express from "express";
import { z } from "zod";
import prisma from "@repo/db/client";
import authMiddleware from "./middleware";

const router = express.Router();

const eventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    start: z.string().datetime(),
    end: z.string().datetime(),
    allDay: z.boolean(),
    description: z.string().optional(),
    color: z.string().optional(),
});

router.get("/getEvents", authMiddleware, async (req: any, res) => {
    try {
        const eventList = await prisma.event.findMany({
            where: {
                userId: req.userId
            },
            orderBy: {
                start: "asc"
            }
        })
        res.status(200).json({
            success: true,
            data: eventList
        })
        return;
    } catch (e) {
        console.error("Error fetching events:", e);
        res.status(500).json({
            success: false,
            message: "Failed to fetch events"
        })
        return
    }
})

router.post("/createEvent", authMiddleware, async (req: any, res) => {
    try {
        const validationResult = eventSchema.safeParse(req.body)
        
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Invalid event data",
                errors: validationResult.error.errors,
            });
            return;
        }

        const { title, start, end, allDay, description, color } = validationResult.data

        const newEvent = await prisma.event.create({
            data: {
                title,
                start,
                end,
                allDay,
                description,
                color,
                userId: req.userId
            }
        })
        res.status(201).json({
            success: true,
            data: newEvent,
        });
        return
    } catch (e) {
        console.error("Error creating event:", e);
        res.status(500).json({
            success: false,
            message: "Failed to create event",
        });
        return
    }
})


router.put("/updateEvent/:id", authMiddleware, async (req: any, res) => {
    try {
        const { id } = req.params;
        const validationResult = eventSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: "Invalid event data",
                errors: validationResult.error.errors,
            });
            return
        }

        const existingEvent = await prisma.event.findUnique({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!existingEvent) {
            res.status(404).json({
                success: false,
                message: "Event not found or you don't have permission to update it",
            });
            return
        }

        const { title, start, end, allDay, description, color } = validationResult.data;

        const updatedEvent = await prisma.event.update({
            where: {
                id,
            },
            data: {
                title,
                start,
                end,
                allDay,
                description,
                color,
                updatedAt: new Date(),
            },
        });

        res.status(200).json({
            success: true,
            data: updatedEvent,
        });
        return
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update event",
        });
        return
    }
});

// DELETE an event
router.delete("/deleteEvent/:id", authMiddleware, async (req: any, res) => {
    try {
        const { id } = req.params;

        // Check if the event exists and belongs to this user
        const existingEvent = await prisma.event.findUnique({
            where: {
                id,
                userId: req.userId,
            },
        });

        if (!existingEvent) {
            res.status(404).json({
                success: false,
                message: "Event not found or you don't have permission to delete it",
            });
            return;
        }

        await prisma.event.delete({
            where: {
                id,
            },
        });

        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
        });
        return;
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete event",
        });
        return;
    }
});

export default router