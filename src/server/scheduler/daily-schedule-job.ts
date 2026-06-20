import { fetchNext24Hours } from '../utils/anilist.js';
import { redis, scheduler } from "@devvit/web/server";

export async function daily_schedule_job(req: any, res: any): Promise<any> {
  try {
    console.log("[Daily Cron] Starting automated synchronization pipeline");
    
    const scheduleList = await fetchNext24Hours();
    if (!scheduleList || scheduleList.length === 0) {
      console.log("[Daily Cron] No upcoming releases detected for this 24-hour window");
      return res.status(200).json({ message: "Job completed: Empty schedule list" });
    }

    let alarmsSet = 0;

    for (const item of scheduleList) {
      const mediaId = item.mediaId || item.media?.id;
      const epNum = item.episode;
      const airingAtUnix = item.airingAt; 

      if (!mediaId || !epNum || !airingAtUnix) {
        continue;
      }
      
      const dedupKey = `alarm:${mediaId}:${epNum}`;
      const alreadyScheduled = await redis.get(dedupKey);

      if (!alreadyScheduled) {
        await scheduler.runJob({
          name: 'post-episode-alarm', 
          data: { mediaId: mediaId, episode: epNum },
          runAt: new Date(airingAtUnix * 1000) 
        });

        // Set the tracking key to expire after 48 hours
        await redis.set(dedupKey, "1", { expiration: new Date(Date.now() + 172800 * 1000) });
        
        alarmsSet++;
        console.log(`[Daily Cron] Scheduled post-episode-alarm for Media ID: ${mediaId}, Episode: ${epNum}`);
      }
    }

    console.log(`[Daily Cron] Synchronization pipeline finished. Operations queued: ${alarmsSet}`);
    return res.status(200).json({ message: `Successfully queued ${alarmsSet} jobs.` });
    
  } catch (error: any) {
    console.error("[Daily Cron] Master process encountered an error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}