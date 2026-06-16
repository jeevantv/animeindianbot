import type { Request, Response } from "express";
import { reddit, context } from "@devvit/web/server"
import { ApiError, ApiResponse } from "../utils/index"

export const example_1_min_scheduler = async (req: Request, res: Response): Promise<void> => {
    const { subredditName } = context;
    if (!subredditName) throw new ApiError(500, "subredditName is required");
    try {
        console.log(`Cron triggered at ${new Date().toISOString()}!`)
        const data = await reddit.submitPost({
            subredditName,
            title: `Post at ${new Date().toISOString()}`,
            text: `Post at ${new Date().toISOString()}`,
        })
        console.log(`Created post with ID: ${data.id}`)
        res.status(200).json(new ApiResponse(200, { id: data.id, url: data.url }));
    } catch (err: any) {
        console.error("Scheduler error:", err.message);
        res.status(500).json(new ApiError(500, err?.message));
    }
}