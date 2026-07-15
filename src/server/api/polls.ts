import type { Request, Response } from "express"
import { ApiError, ApiResponse } from "../utils"
import { pollOptions, pollMeta, pollVoters, pollVotes } from '../redis/keys'
import { redis, context, reddit } from "@devvit/web/server"

type VoteRequest = {
    optionKeys: string[]; // e.g. ["0"] or ["0", "2"] for multiple
};


export const castVotes = async (req: Request, res: Response) => {
    try {
        const { postId, userId } = context;
        if (!postId) {
            return res.status(400).json(new ApiError(400, "PostId is required"))
        }
        if (!userId) {
            return res.status(400).json(new ApiError(400, "UserId is required"))
        }
        const { optionKeys } = req.body as VoteRequest;
        if (!optionKeys || optionKeys.length === 0) {
            return res.status(400).json(new ApiError(400, "At least one option required"));
        }
        const meta = await redis.hGetAll(pollMeta(postId));
        if (!meta || !meta.expirationTimestamp) {
            return res.status(404).json(new ApiError(404, "Poll not found"));
        }
        if (new Date() > new Date(meta.expirationTimestamp)) {
            return res.status(403).json(new ApiError(403, "Poll has expired"));
        }

        const allowMultiple = meta.allowMultipleVotes === "true";
        if (!allowMultiple && optionKeys.length > 1) {
            return res.status(400).json(new ApiError(400, "This poll does not allow multiple votes"));
        }
        const votersKey = pollVoters(postId);
        const txn = await redis.watch(votersKey);
        const existingVoteRaw = await redis.hGet(votersKey, userId);

        const alreadyVotedKeys: string[] = existingVoteRaw
            ? existingVoteRaw.split(",")
            : [];

        const duplicates = optionKeys.filter((k) => alreadyVotedKeys.includes(k));
        if (duplicates.length > 0) {
            await txn.unwatch();
            return res.status(409).json(
                new ApiError(409, `Already voted on option(s): ${duplicates.join(", ")}`)
            );
        }
        await txn.multi();

        const votesKey = pollVotes(postId);
        for (const key of optionKeys) {
            await txn.hIncrBy(votesKey, key, 1);
        }
        const newVotedKeys = [...alreadyVotedKeys, ...optionKeys].join(",");
        await txn.hSet(votersKey, { [userId]: newVotedKeys });
        const result = await txn.exec();

        if (result === null) {
            return res.status(409).json(new ApiError(409, "Vote conflict, please retry"));
        }

        return res.status(200).json(new ApiResponse(200, null, "Vote cast successfully"));

    } catch (error) {
        console.error(`[ERROR] cast votes api : ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error)
        return res.status(500).json(new ApiError(500, errorMessage))
    }
}

export const getPollData = async (_req: Request, res: Response) => {
    try {
        const { postId, userId } = context;
        if (!postId) {
            return res.status(400).json(new ApiError(400, "PostId is required"));
        }

        const [optionsRaw, votesRaw, existingVoteRaw] = await Promise.all([
            redis.hGetAll(pollOptions(postId)),
            redis.hGetAll(pollVotes(postId)),
            userId ? redis.hGet(pollVoters(postId), userId) : Promise.resolve(undefined),
        ]);

        if (Object.keys(optionsRaw).length === 0) {
            return res.status(404).json(new ApiError(404, "Poll not found"));
        }
        console.debug("optionsRaw", optionsRaw)
        console.debug("votesRaw", votesRaw)
        console.debug("existingVoteRaw", existingVoteRaw)
        const options = Object.entries(optionsRaw)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([key, value]) => ({
                key,
                value,
                votes: Number(votesRaw[key] ?? 0),
            }));

        const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
        const userVotes: string[] = existingVoteRaw ? existingVoteRaw.split(",") : [];
        console.debug("options", options)
        return res.status(200).json(new ApiResponse(200, {
            options,
            totalVotes,
            userVotes,
        }, "Data fetched successfully"));

    } catch (error) {
        console.error(`[ERROR] get poll data api : ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error)
        return res.status(500).json(new ApiError(500, errorMessage))
    }
}

export const isMod = async (_req: Request, res: Response) => {
    try {
        const currentUser = await reddit.getCurrentUser();
        if (!currentUser) {
            return res.status(200).json(new ApiResponse(200, { isModerator: false }, "Data fetched successfully"));
        }
        const permissions = await currentUser.getModPermissionsForSubreddit(context.subredditName!);
        const isModerator = Boolean(permissions && permissions.length > 0);
        return res.status(200).json(new ApiResponse(200, { isModerator }, "Data fetched successfully"));
    } catch (error) {
        console.error(`[ERROR] get poll data api : ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error)
        return res.status(500).json(new ApiError(500, errorMessage))
    }
}

export const resetPollVotes = async (_req: Request, res: Response) => {
    try {
        const postId = context.postId;
        if (!postId) {
            return res.status(400).json(new ApiError(400, "PostId is required"));
        }
        const currentUser = await reddit.getCurrentUser();
        if (!currentUser) {
            return res.status(403).json(new ApiError(403, "Only moderators can reset poll votes"));
        }
        const permissions = await currentUser.getModPermissionsForSubreddit(context.subredditName!);
        const isModerator = Boolean(permissions && permissions.length > 0);
        if (!isModerator) {
            return res.status(403).json(new ApiError(403, "Only moderators can reset poll votes"));
        }
        const votesKey = pollVotes(postId);
        const votersKey = pollVoters(postId);

        await redis.del(votersKey);
        const currentVotes = await redis.hGetAll(votesKey);
        if (currentVotes) {
            const resetRecord: Record<string, string> = {};
            for (const key of Object.keys(currentVotes)) {
                resetRecord[key] = "0";
            }
            await redis.hSet(votesKey, resetRecord);
        }
        return res.status(200).json(new ApiResponse(200, null, "Poll votes reset successfully"));
    } catch (error) {
        console.error(`[ERROR] reset poll votes api : ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json(new ApiError(500, errorMessage));
    }
}