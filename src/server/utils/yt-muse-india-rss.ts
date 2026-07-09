const RSS_URL = (channelId: string): string =>
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

export interface MuseUpload {
    videoId: string;
    title: string;
    url: string;
    publishedAt: Date;
}

export interface ParsedDubTitle {
    showName: string;
    episodeNumber: number;
    language?: string;
}

export async function getLatestUploads(channelId: string): Promise<MuseUpload[]> {
    try {
        const res = await fetch(RSS_URL(channelId));
        if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
        const xml = await res.text();

        const uploads: MuseUpload[] = [];

        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let entry: RegExpExecArray | null;

        while ((entry = entryRegex.exec(xml)) !== null) {
            const block = entry[1];
            if (!block) {
                throw new Error("Error in fetching xml");
            }
            const videoId = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
            const title = block.match(/<title>(.*?)<\/title>/)?.[1];
            const url = block.match(/<link rel="alternate" href="(.*?)"/)?.[1];
            const published = block.match(/<published>(.*?)<\/published>/)?.[1];

            if (!videoId || !title || !url || !published) continue;

            uploads.push({
                videoId,
                title: decodeXml(title),
                url,
                publishedAt: new Date(published),
            });
        }

        return uploads;
    } catch (error) {
        console.error(`Error fetching uploads for channel ${channelId}:`, error);
        return [];
    }
}

export function parseDubTitle(title: string): ParsedDubTitle | null {
    if (!/Episode\s*\d+/i.test(title)) return null;

    const tagsMatch = title.match(/\[(.*?)\]/g);
    let language: string | undefined;
    if (tagsMatch && tagsMatch.length > 0) {
        language = tagsMatch.map(t => t.replace(/[\[\]]/g, '')).join(', ');
    }

    let cleaned = title.replace(/\[.*?\]/g, '');

    cleaned = cleaned.replace(/\|?\s*Muse IN\s*$/i, '').trim();

    const match = cleaned.match(/^(.+?)\s*(?:[-|]\s*)?Episode\s*(\d+)/i);
    if (!match || !match[1] || !match[2]) {
        return null;
    }

    return {
        showName: match[1].replace(/[-\s|]+$/, '').trim(),
        episodeNumber: parseInt(match[2], 10),
        language
    };
}

function decodeXml(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}