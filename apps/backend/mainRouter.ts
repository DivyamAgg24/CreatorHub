import express from "express"
import AuthRouter from "./auth.js"
import IdeaRouter from "./ideas.js"
import EventRouter from "./events.js"

const router = express.Router()

router.use("/auth", AuthRouter)
router.use("/ideas", IdeaRouter )
router.use("/events", EventRouter)

export default router