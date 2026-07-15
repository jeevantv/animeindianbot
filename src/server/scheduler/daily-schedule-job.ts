import { fetchNext24Hours } from '../utils/anilist.js';
import { redis, scheduler, settings } from "@devvit/web/server";
import { scheduleKey, jobId } from '../redis/keys.js'
import type { Response, Request } from 'express';
import { ApiError, ApiResponse } from '../utils';
import type { ScheduledJob } from '@devvit/web/server';

export async function daily_schedule_job(_req: Request, res: Response): Promise<any> {
  try {
    console.debug("[Daily Cron] Starting automated synchronization pipeline");

    const scheduleList = await fetchNext24Hours();
    if (!scheduleList || scheduleList.length === 0) {
      console.debug("[Daily Cron] No upcoming releases detected for this 24-hour window");
      throw new ApiError(400, "No upcoming releases detected for this 24-hour window")
    }
    const delay = await settings.get("DealyedByMins");
    const delayMins = Number(delay);
    for (const item of scheduleList) {
      const mediaId = item.media?.id;
      const epNum = item.episode;
      const airingAtUnix = item.airingAt;

      if (!mediaId || !epNum || !airingAtUnix) {
        continue;
      }

      console.debug(`[Daily Cron] Processing item ${JSON.stringify(item)}`)
      const alreadyScheduled = await redis.exists(scheduleKey(mediaId, epNum));

      if (!alreadyScheduled) {
        const scheduledTime = new Date((airingAtUnix + delayMins * 60) * 1000);
        const scheduledJob: ScheduledJob = {
          id: jobId(mediaId, epNum),
          name: 'post-episode-schedule',
          data: {
            mediaId: mediaId,
            episode: epNum
          },
          runAt: scheduledTime,
        }
        const reddidJobId = await scheduler.runJob(scheduledJob)

        await redis.hSet(scheduleKey(mediaId, epNum),
          {
            "titleEnglish": item.media.title.english || "English Name N/A",
            "titleRomaji": item.media.title.romaji || "Romaji Name N/A",
            "episodeNumber": String(item.episode),
            "airingAt": new Date(item.airingAt * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            "delayedByMins": String(delayMins),
            "scheduledPostAt": scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            "popularity": String(item.media.popularity),
            "countryOfOrigin": item.media.countryOfOrigin,
            "format": item.media.format,
            "jobId": jobId(mediaId, epNum),
            "redditJobId": reddidJobId,
            "canceled": "0"
          });

        // Set the tracking key to expire after 48 hours
        await redis.expire(scheduleKey(mediaId, epNum), 172800);

        console.log(`[Daily Cron] Scheduled post-episode-job for Media ID: ${mediaId}, Episode: ${epNum} with reddit Job ID ${reddidJobId}`);
      }
    }

    console.log(`[Daily Cron] Synchronization pipeline finished. Operations queued`);
    return res.status(200).json(new ApiResponse(200, null));

  } catch (error: any) {
    console.error("[Daily Cron] Master process encountered an error:", error.message);
    throw new ApiError(500, "Internal server error")
  }
}