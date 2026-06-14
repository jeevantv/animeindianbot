# How to Run `animeindianbot`

This guide explains how to set up and run the `animeindianbot` Devvit app locally.

## Prerequisites

- **Node.js**: Ensure you have Node.js version `22.6.0` or higher installed (as specified in `package.json`).
- **npm**: The Node Package Manager, which comes with Node.js.

## Setup Instructions

1. **Install Dependencies**
   Navigate to the project root directory in your terminal and run:
   ```bash
   npm install
   ```

2. **Authenticate with Devvit**
   Before you can run or deploy the app, you need to log in to Devvit. Run the following command:
   ```bash
   npm run login
   ```
   *(Alternatively, you can run `npx devvit login`)*
   
   This will open a browser window and ask you to authorize the Devvit CLI with your Reddit account.

## Running the App (Playtesting)

To start the local development server and playtest the app in a default playtest subreddit, run:

```bash
npm run dev
```

This command runs `devvit playtest` under the hood. It will build the app, upload assets, and provide you with a way to test your bot on Reddit.

## Other Commands

- **Build**: `npm run build` - Builds the project.
- **Type Check**: `npm run type-check` - Runs TypeScript type checking.
- **Deploy**: `npm run deploy` - Builds and uploads the app to Devvit.
- **Launch**: `npm run launch` - Builds, deploys, and publishes the app.
