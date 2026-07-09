import { settings } from "@devvit/web/server";

export async function socialSettings(): Promise<string | null> {
    const [enableSocialLinks, discordInviteLink, instagramLink, youtubeChannelLink, xLink] = await Promise.all([
        settings.get("enableSocialLinks"),
        settings.get("discordInviteLink"),
        settings.get("instagramLink"),
        settings.get("youtubeChannelLink"),
        settings.get("xLink"),
    ]);
    if (!enableSocialLinks) return null
    if (!discordInviteLink && !instagramLink && !youtubeChannelLink && !xLink) return null
    const links: string[] = [];
    if (discordInviteLink) links.push(`- [Discord](<${discordInviteLink}>)`);
    if (instagramLink) links.push(`- [Instagram](<${instagramLink}>)`);
    if (youtubeChannelLink) links.push(`- [Youtube](<${youtubeChannelLink}>)`);
    if (xLink) links.push(`- [X.com](<${xLink}>)`);

    const socialLinks = `Our Socials\n\n${links.join('\n\n')}`;
    return socialLinks;
}