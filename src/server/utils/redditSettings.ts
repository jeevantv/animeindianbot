import { settings } from "@devvit/web/server";

export async function socialSettings(): Promise<string | null> {
    const [enableSocialLinks, discordInviteLink, instagramLink, youtubeChannelLink] = await Promise.all([
        settings.get("enableSocialLinks"),
        settings.get("discordInviteLink"),
        settings.get("instagramLink"),
        settings.get("youtubeChannelLink"),
    ]);

    if (!enableSocialLinks) return null
    const socialLinks: string = `
        Our Socials
            - ${discordInviteLink ? `[Discord](${discordInviteLink})` : ''}
            - ${instagramLink ? `[Instagram](${instagramLink})` : ''}
            - ${youtubeChannelLink ? `[Youtube](${youtubeChannelLink})` : ''}
        `
    return socialLinks
}