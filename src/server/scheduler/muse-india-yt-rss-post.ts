import { getLatestUploads, parseDubTitle, ApiError, ApiResponse, socialSettings } from '../utils';
import type { Response, Request } from 'express';
import { context, reddit, settings, redis } from "@devvit/web/server"

export async function museIndiaScheduler(_req: Request, res: Response): Promise<void> {
    console.debug('[Muse India Scheduler] Starting job execution')
    const MUSE_INDIA_CHANNEL_ID = 'UCYYhAzgWuxPauRXdPpLAX3Q'
    const [enableMuseIndiaDicussion, PostFlairId] = await Promise.all([
        settings.get("enableMuseIndiaDicussion"),
        settings.get("episodeDiscussionFlairId")
    ])

    if (!enableMuseIndiaDicussion) {
        console.debug('[Muse India Scheduler] Enable Muse India Dicussion is not enabled');
        res.status(500).json(new ApiError(500, 'Enable Muse India Dicussion is not enabled'));
        return;
    }
    if (!PostFlairId) {
        console.error('[Muse India Scheduler] Flair ID is not set');
        res.status(500).json(new ApiError(500, 'Flair ID is not set'));
        return;
    }

    try {
        console.debug(`[Muse India Scheduler] Fetching latest uploads for channel ${MUSE_INDIA_CHANNEL_ID}`);
        const uploads = await getLatestUploads(MUSE_INDIA_CHANNEL_ID);
        console.debug(`[Muse India Scheduler] Fetched ${uploads.length} uploads from channel`);

        const lastCheckedStr = await redis.get('muse_india_last_checked');
        console.debug(`[Muse India Scheduler] Last checked time string from Redis: ${lastCheckedStr || 'None'}`);

        const now = new Date();
        const cutoff = lastCheckedStr ? new Date(lastCheckedStr) : new Date(now.getTime() - 15 * 60 * 1000);
        let latestPublished = cutoff;
        console.debug(`[Muse India Scheduler] Calculated cutoff time: ${cutoff.toISOString()}`);

        const postedIds: string[] = [];
        const socialLinks = await socialSettings();
        for (const upload of uploads) {
            if (upload.publishedAt <= cutoff) {
                console.debug(`[Muse India Scheduler] Skipping upload older than cutoff: ${upload.videoId} (${upload.publishedAt.toISOString()})`);
                continue;
            }
            if (upload.publishedAt > latestPublished) {
                latestPublished = upload.publishedAt;
            }

            console.debug(`[Muse India Scheduler] Parsing title for upload: ${upload.title}`);
            const parsed = parseDubTitle(upload.title);
            if (!parsed) {
                console.debug(`[Muse India Scheduler] Title could not be parsed as an episode: ${upload.title}`);
                continue;
            }

            console.debug(`[Muse India Scheduler] Posting discussion thread for: ${parsed.showName} Episode ${parsed.episodeNumber}`);
            const post = await reddit.submitPost({
                flairId: PostFlairId as string,
                subredditName: context.subredditName!,
                title: `[Muse India] ${parsed.showName} - Episode ${parsed.episodeNumber} | ${parsed.language} Discussion Thread`,
                text: `
                    Muse India has dropped a new episode of ${parsed.showName} - Episode ${parsed.episodeNumber}\n\n 
                    ${parsed.language ? `**Language/Dub:** ${parsed.language}` : ''}\n\n
                    ---
                    **Watch here:**\n\n
                    [YouTube](<https://www.youtube.com/watch?v=${upload.videoId}>)\n\n
                    **Reminder:** No spoilers beyond this episode.\n\n
                    ${socialLinks ? `---\n\n ${socialLinks}\n\n` : ''} 
                    ---
                    This is an automated post. For feedback, questions, or concerns,contact the mod team
                `.replace(/^[ \t]+/gm, '').trim()       //any text indented with 4 or more spaces is treated as a code block / blockquote
            })
            console.debug(`[Muse India Scheduler] Successfully submitted post with ID: ${post.id} and the video ID : ${upload.videoId}`);
            postedIds.push(post.id);
        }

        if (latestPublished > cutoff) {
            console.debug(`[Muse India Scheduler] Updating 'muse_india_last_checked' to ${latestPublished.toISOString()}`);
            await redis.set('muse_india_last_checked', latestPublished.toISOString());
        } else if (!lastCheckedStr && uploads.length > 0) {
            const maxPublished = new Date(Math.max(...uploads.map(u => u.publishedAt.getTime())));
            console.debug(`[Muse India Scheduler] Initializing 'muse_india_last_checked' to most recent video time: ${maxPublished.toISOString()}`);
            await redis.set('muse_india_last_checked', maxPublished.toISOString());
        } else {
            console.debug('[Muse India Scheduler] No new valid uploads; last checked time unchanged');
        }

        console.debug(`[Muse India Scheduler] Job execution finished. Total posts created: ${postedIds.length}`);
        res.status(200).json(new ApiResponse(200, { postedIds }, "Job executed successfully"));
    } catch (error) {
        console.error('[Muse India Scheduler] Execution halted due to terminal error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json(new ApiError(500, errorMessage));
    }

}