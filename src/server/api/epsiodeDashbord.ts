import type { Request, Response } from "express"
import { ApiError, ApiResponse } from "../utils"
import { fetchLiveEpisodeData } from "../utils/anilist"
import { scheduler, redis, reddit, context } from "@devvit/web/server"
import { scheduleKey } from '../redis/keys'

export const getScheduledJob = async (_req: Request, res: Response): Promise<any> => {
    try {
        const scheduledTotalJobs = await scheduler.listJobs();
        const data: any[] = []
        for (const job of scheduledTotalJobs) {
            const jobData = job.data as { mediaId?: string | number, episode?: string | number } | undefined;
            if (jobData?.mediaId && jobData?.episode) {
                const redisData = await redis.hGetAll(scheduleKey(jobData.mediaId, jobData.episode))
                data.push(redisData)
            }
        }
        return res.status(200).json(new ApiResponse(200, data));
    } catch (error: any) {
        console.log("error", error.message)
        return res.status(500).json(new ApiError(500, error.message));
    }
}


export const cancelJob = async (req: Request, res: Response): Promise<any> => {
    try {
        const username = await reddit.getCurrentUsername();
        if (!username) {
            return res.status(401).json(new ApiError(401, 'User not logged in'));
        }

        const user = await reddit.getUserByUsername(username);
        if (!user) {
            return res.status(404).json(new ApiError(404, 'User not found'));
        }

        const modPermissions = await user.getModPermissionsForSubreddit(context.subredditName!);
        if (modPermissions.length === 0) {
            return res.status(403).json(new ApiError(403, 'Not a moderator'));
        }

        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json(new ApiError(400, 'JobID required'));
        }

        await scheduler.cancelJob(jobId);

        return res.status(200).json(new ApiResponse(200, null));
    } catch (error: any) {
        console.error("Cancel job error:", error.message);
        return res.status(500).json(new ApiError(500, error?.message));
    }
}

export const getEpisodeDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { mediaId } = req.query;
        if (!mediaId) {
            return res.status(400).json(new ApiError(400, "mediaId is required"));
        }

        const data = await fetchLiveEpisodeData(Number(mediaId));
        return res.status(200).json(new ApiResponse(200, data));
    } catch (error: any) {
        console.error("Fetch episode details error:", error.message);
        return res.status(500).json(new ApiError(500, error?.message));
    }
}