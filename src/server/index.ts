import {
    createServer,
    getServerPort,
} from "@devvit/web/server";
import express from "express"
import scheduler from "./scheduler";
import menuRouter from "./menu";
import apiRouter from "./api/index.js";
import formRouter from "./forms";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use("/internal/scheduler", scheduler);
app.use("/internal/menu", menuRouter);
app.use('/api', apiRouter);
app.use('/internal/form', formRouter)

const server = createServer(app);
server.on("error", (err) => console.error(`Server error: ${err.stack}`));
server.listen(getServerPort()); 