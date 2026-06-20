import { context, reddit } from "@devvit/web/server";
import { fetchLiveEpisodeData } from "../utils/anilist.js";

export async function post_episode_alarm(req: any, res: any): Promise<any> {
  try {
    const { data } = req.body; 
    const mediaId = data?.mediaId;
    const episode = data?.episode;

    if (!mediaId || !episode) {
       return res.status(400).json({ error: "Context parameters payload incomplete" });
    }

    console.log(`[Alarm Dispatcher] Evaluating job payload for Media ID: ${mediaId}, Episode: ${episode}`);

    const animeData = await fetchLiveEpisodeData(mediaId);
    if (!animeData) {
      throw new Error(`Unable to fetch valid live context mapping for asset ${mediaId}`);
    }

    const title = animeData.title?.romaji || animeData.title?.english || 'Unknown Anime';
    const validLinks = (animeData.externalLinks || []).filter((link: any) => !link.isDisabled);
    
    const streaming = validLinks.filter((l: any) => l.type === 'STREAMING');
    const info = validLinks.filter((l: any) => ['INFO', 'WEB_SITE'].includes(l.type));
    const social = validLinks.filter((l: any) => l.type === 'SOCIAL');

    let linksText = '';
    if (streaming.length > 0) {
        linksText += '\n\n**Watch Here:**\n' + streaming.map((l: any) => `- [${l.site}](${l.url})`).join('\n');
    }
    if (info.length > 0) {
        linksText += '\n\n**Information:**\n' + info.map((l: any) => `- [${l.site}](${l.url})`).join('\n');
    }
    if (social.length > 0) {
        linksText += '\n\n**Social:**\n' + social.map((l: any) => `- [${l.site}](${l.url})`).join('\n');
    }

    const subredditName = context.subredditName;
    if (!subredditName) {
      return res.status(500).json({ error: "Context scope extraction failed: subredditName missing" });
    }

    const post = await reddit.submitPost({
      subredditName: subredditName,
      title: `${title} - Episode ${episode} Discussion Thread`,
      text: `Welcome to the discussion for **${title}**, Episode ${episode}!\n\n*Be mindful of spoilers.*${linksText}`,
    });
    
    console.log(`[Alarm Dispatcher] Asset deployed successfully to r/${subredditName}. Assigned reference ID: ${post.id}`);
    return res.status(200).json({ message: "Post generated successfully", postId: post.id });
    
  } catch (error: any) {
    console.error(`[Alarm Dispatcher] Execution halted due to terminal error:`, error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}