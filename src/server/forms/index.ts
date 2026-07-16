import { context, reddit, redis, scheduler, settings } from '@devvit/web/server';
import type { ScheduledJob } from '@devvit/web/server';
import type { UiResponse } from '@devvit/web/shared';
import { Router } from 'express';
import { pollMeta, pollOptions, pollVotes, scheduleKey, jobId } from '../redis/keys';
import { fetchLiveEpisodeData } from '../utils/anilist.js';
type PollForm = {
    flairId: string[];
    title: string;
    body: string;
    'poll-options': string;
    pollDurationDays: number;
    allowMultipleVotes: boolean;
}

type PollV2Form = {
    flairId: string[];
    title: string;
    'poll-options': string;
    pollDurationDays: number;
    allowMultipleVotes: boolean;
}

type ScheduleAnimeForm = {
    mediaId: number;
    episode: number;
    time: string;
}

const formRouter = Router()

formRouter.post<string, never, UiResponse, PollForm>('/pollForm', async (req, res) => {
    const { flairId, title, body, 'poll-options': pollOptionsRaw, pollDurationDays, allowMultipleVotes } = req.body;
    const options = pollOptionsRaw.split(',').map((option: string) => option.trim());

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + Number(pollDurationDays));

    console.debug("flairId", flairId);
    console.debug("title", title);
    console.debug("body", body);
    console.debug("poll-options", options);
    console.debug("poll expiration timestamp (ISO)", expirationDate.toISOString());
    console.debug("allowMultipleVotes", allowMultipleVotes);

    const postData = {
        body,
        expirationTimestamp: expirationDate.toISOString(),
        allowMultipleVotes
    }

    const pollPost = await reddit.submitCustomPost(({
        flairId: flairId[0],
        title: title,
        entry: 'polls-splash',
        subredditName: context.subredditName!,
        postData
    }))
    await redis.hSet(pollMeta(pollPost.id),
        {
            expirationTimestamp: expirationDate.toISOString(),
            allowMultipleVotes: String(allowMultipleVotes)
        }
    )
    const optionRecord: Record<string, string> = {}
    options.forEach((option, index) => {
        optionRecord[String(index)] = option
    })
    await redis.hSet(pollOptions(pollPost.id), optionRecord)
    const voteRecord: Record<string, string> = {}
    options.forEach((_, index) => {
        voteRecord[String(index)] = '0'
    })
    await redis.hSet(pollVotes(pollPost.id), voteRecord)
    console.debug('Poll Post Id', pollPost.id)
    return res.json({
        showToast: { text: 'Poll post created', appearance: 'success' },
        navigateTo: pollPost
    })
})

formRouter.post<string, never, UiResponse, PollV2Form>('/poll-v2-Form', async (req, res) => {
    const { flairId, title, 'poll-options': pollOptionsRaw, pollDurationDays, allowMultipleVotes } = req.body;
    const options = pollOptionsRaw.split(',').map((option: string) => option.trim());

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + Number(pollDurationDays));

    const postData = {
        title,
        expirationTimestamp: expirationDate.toISOString(),
        allowMultipleVotes
    };

    const pollPost = await reddit.submitCustomPost({
        flairId: flairId?.[0],
        title: title,
        entry: 'polls-v2',
        subredditName: context.subredditName!,
        postData
    });

    await redis.hSet(pollMeta(pollPost.id), {
        expirationTimestamp: expirationDate.toISOString(),
        allowMultipleVotes: String(allowMultipleVotes)
    });

    const optionRecord: Record<string, string> = {};
    options.forEach((option, index) => {
        optionRecord[String(index)] = option;
    });
    await redis.hSet(pollOptions(pollPost.id), optionRecord);

    const voteRecord: Record<string, string> = {};
    options.forEach((_, index) => {
        voteRecord[String(index)] = '0';
    });
    await redis.hSet(pollVotes(pollPost.id), voteRecord);

    return res.json({
        showToast: { text: 'Poll v2 post created', appearance: 'success' },
        navigateTo: pollPost
    });
});

formRouter.post<string, never, UiResponse, ScheduleAnimeForm>('/schedule-anime-Form', async (req, res) => {
    const { mediaId, episode, time } = req.body;
    if (!mediaId || !episode || !time) {
        return res.json({ showToast: { text: 'Media ID, Episode, and Time are required', appearance: 'neutral' } });
    }

    const timeMatch = time.match(/^([01]\d|2[0-3]):?([0-5]\d)$/);
    if (!timeMatch || !timeMatch[1] || !timeMatch[2]) {
        return res.json({ showToast: { text: 'Time must be in HH:MM 24-hour format (e.g. 14:30)', appearance: 'neutral' } });
    }

    console.log(`[Form] Manually scheduling Media ID: ${mediaId}, Episode: ${episode} for today at ${time}`);
    const animeData = await fetchLiveEpisodeData(Number(mediaId));
    if (!animeData) {
        return res.json({ showToast: { text: `AniList Media ID ${mediaId} not found`, appearance: 'neutral' } });
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    const now = new Date();
    const airingAtDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    const airingAtUnix = Math.floor(airingAtDate.getTime() / 1000);

    const delay = await settings.get("DealyedByMins");
    const delayMins = Number(delay) || 0;

    const scheduledTime = new Date((airingAtUnix + delayMins * 60) * 1000);

    const scheduledJob: ScheduledJob = {
        id: jobId(Number(mediaId), Number(episode)),
        name: 'post-episode-schedule',
        data: {
            mediaId: Number(mediaId),
            episode: Number(episode)
        },
        runAt: scheduledTime,
    };

    const reddidJobId = await scheduler.runJob(scheduledJob);

    await redis.hSet(scheduleKey(Number(mediaId), Number(episode)), {
        "titleEnglish": animeData.title?.english || "English Name N/A",
        "titleRomaji": animeData.title?.romaji || "Romaji Name N/A",
        "episodeNumber": String(episode),
        "airingAt": airingAtDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        "delayedByMins": String(delayMins),
        "scheduledPostAt": scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        "popularity": "0",
        "countryOfOrigin": "JP",
        "format": "TV",
        "jobId": jobId(Number(mediaId), Number(episode)),
        "redditJobId": reddidJobId,
        "canceled": "0"
    });

    await redis.expire(scheduleKey(Number(mediaId), Number(episode)), 172800);

    const titleName = animeData.title?.english || animeData.title?.romaji || `ID ${mediaId}`;
    console.log(`[Form] Successfully scheduled episode ${episode} for ${titleName} (Job ID: ${reddidJobId})`);

    return res.json({
        showToast: { text: `Scheduled Ep ${episode} of ${titleName} at ${time}`, appearance: 'success' }
    });
});

export default formRouter