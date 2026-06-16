import {
    createServer,
    getServerPort,
} from "@devvit/web/server";
import express from "express"
import scheduler from "./scheduler";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use("/internal/scheduler", scheduler);

const server = createServer(app);
server.on("error", (err) => console.error(`Server error: ${err.stack}`));
server.listen(getServerPort()); 