import express from "express"
import mainRouter from "./../mainRouter.js"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())
const router = express.Router()

app.use("/v1", mainRouter)




app.listen(3000)