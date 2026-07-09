import { context, reddit, settings } from "@devvit/web/server";
import { fetchLiveEpisodeData } from "../utils/anilist.js";
import type { Response, Request } from 'express';
import { ApiError, ApiResponse, socialSettings } from '../utils';

export async function post_episode_alarm(req: Request, res: Response): Promise<any> {
  try {
    const { data } = req.body;
    const mediaId = data?.mediaId;
    const episode = data?.episode;
    const PostFlairId: string | undefined = await settings.get("episodeDiscussionFlairId")
    const socialLinks = await socialSettings();

    if (!mediaId || !episode) {
      throw new ApiError(400, "Context parameters payload incomplete")
    }

    console.log(`[Alarm Dispatcher] Evaluating job payload for Media ID: ${mediaId}, Episode: ${episode}`);

    const animeData = await fetchLiveEpisodeData(mediaId);
    if (!animeData) {
      throw new ApiError(400, `Unable to fetch valid live context mapping for asset ${mediaId}`);
    }
    const title = [animeData.title?.english, animeData.title?.romaji].filter(Boolean).join(' | ');
    const validLinks = (animeData.externalLinks || []).filter((link: any) => !link.isDisabled);

    const streaming = validLinks.filter((l: any) => l.type === 'STREAMING');
    const info = validLinks.filter((l: any) => l.type === 'INFO');
    const social = validLinks.filter((l: any) => l.type === 'SOCIAL');

    let linksText = '';
    if (streaming.length > 0) {
      linksText += '\n\n**Watch Here:**\n\n' + streaming.map((l: any) => `- [${l.site}](<${l.url}>)`).join('\n');
    }
    if (info.length > 0) {
      linksText += '\n\n**Information:**\n\n' + info.map((l: any) => `- [${l.site}](<${l.url}>)`).join('\n');
    }
    if (social.length > 0) {
      linksText += '\n\n**Social:**\n\n' + social.map((l: any) => `- [${l.site}](<${l.url}>)`).join('\n');
    }

    const subredditName = context.subredditName;
    if (!subredditName) {
      throw new ApiError(400, "Context scope extraction failed: subredditName missing");
    }

    const post = await reddit.submitPost({
      flairId: PostFlairId,
      subredditName: context.subredditName!,
      title: `${title} - Episode ${episode} Discussion Thread`,
      text: `
        Welcome to the discussion for **${title}**, Episode ${episode}!\n\n
        ---
        ${linksText}\n\n
        **Reminder:** No spoilers beyond this episode.\n\n
        ${socialLinks ? `---\n\n ${socialLinks}\n\n` : ''}
        ---
        This is an automated post. For feedback, questions, or concerns,contact the mod team
      `.replace(/^[ \t]+/gm, '').trim()       //any text indented with 4 or more spaces is treated as a code block / blockquote,
    });

    console.log(`[Alarm Dispatcher] Asset deployed successfully to r/${subredditName}. Assigned reference ID: ${post.id}`);
    return res.status(200).json(new ApiResponse(200, { postId: post.id }, "Post generated successfully"));

  } catch (error: any) {
    console.error(`[Alarm Dispatcher] Execution halted due to terminal error:`, error.message);
    return res.status(500).json(new ApiError(500, error.message));
  }
}