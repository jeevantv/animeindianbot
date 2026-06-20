# Anime Indian Bot

An automated Reddit bot built on [Devvit](https://developers.reddit.com/) designed for the Anime Indian community.

## Features


- **Anime Schedules**: Fetches daily public anime airing schedules.
- **Streaming Links**: Provides streaming links directly within the discussion threads.

## Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

1. Clone the repository and install dependencies:
   ```sh
   npm install
   ```
2. Log into the Devvit CLI:
   ```sh
   npm run login
   ```
3. Start the development server to test the app on your test subreddit:
   ```sh
   npm run dev
   ```

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run build`: Builds your client and server projects
- `npm run deploy`: Uploads a new version of your app
- `npm run launch`: Publishes your app for review
- `npm run login`: Logs your CLI into Reddit
- `npm run type-check`: Type checks, lints, and prettifies your app

## Fetch Domains

- `graphql.anilist.co` - Used to fetch daily public anime airing schedules and streaming links for automated community discussion threads.
