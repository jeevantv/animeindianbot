# Anime Indian Bot

An automated Reddit bot built on [Devvit](https://developers.reddit.com/) designed for the [animeindian](https://www.reddit.com/r/animeindian/).

## Features

- **Anime Schedules**: Queries AniList daily for anime schedules and creates automated episode discussion threads.
- **Schedule Dashboard**: Interactive dashboard showcasing streaming links and schedules for anime episodes airing on the current day.
- **Polls**: Moderators can create interactive anime discussions and community polls with real-time voting progress and percentage bars right inside Reddit.
- **Muse India Episode Discussion Thread**: Creates new anime episode discussion thread for official Muse India YouTube uploads.

## Bot Settings
Moderators can configure the following settings:

- **Episode Discussion Flair ID**: Required post flair ID assigned when automated discussion threads are published.
- **Delay Minutes**: Optional delay in minutes (defaults to 120, can be set to 0) before posting the discussion thread.
- **Enable Muse India Discussions**: Fetches new episode uploads from Muse India and creates discussion threads.
- **Enable Social Links**: Toggles appending community social links (Discord, Instagram, YouTube, X) at the bottom of discussion threads.
- **Social Media URLs**: Individual URL fields to configure your community Discord invite, Instagram profile, YouTube channel, and X (Twitter) profile.

## Fetch Domains

- `graphql.anilist.co` - Used to fetch daily public anime airing schedules and streaming links for automated community discussion threads.
- `youtube.com` - Used to fetch the latest uploads from Muse India youtube channel.

## Changelog

### v0.0.4 — Initial Release
- Initial release of Anime Indian Bot featuring automated airing schedules, Muse India alerts, interactive polls, and customizable moderator settings.