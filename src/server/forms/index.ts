import { context, reddit } from '@devvit/web/server';
import type { UiResponse } from '@devvit/web/shared';
import { Router } from 'express';

type PollForm = {
    flairId: string[];
    title: string;
    body: string;
    'poll-options': string;
    pollDurationDays: number;
    allowMultipleVotes: boolean;
}

const formRouter = Router()

formRouter.post<string, never, UiResponse, PollForm>('/pollForm', async (req, res) => {
    const { flairId, title, body, 'poll-options': pollOptions, pollDurationDays, allowMultipleVotes } = req.body;
    const options = pollOptions.split(',').map((option: string) => option.trim());

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + Number(pollDurationDays));

    console.log("flairId", flairId);
    console.log("title", title);
    console.log("body", body);
    console.log("poll-options", options);
    console.log("poll expiration timestamp (ISO)", expirationDate.toISOString());
    console.log("allowMultipleVotes", allowMultipleVotes);

    const postData = {
        body,
        pollOptions: options,
        pollDurationDays: pollDurationDays,
        allowMultipleVotes: allowMultipleVotes,
        expirationTimestamp: expirationDate.toISOString(),
    }
    console.log(postData)
    const postDataString = JSON.stringify(postData);
    const postDataSize = Buffer.byteLength(postDataString, 'utf8');
    console.log("postDataSize in kb", postDataSize / 1024);
    const pollPost = await reddit.submitCustomPost(({
        flairId: flairId[0],
        title: title,
        entry: 'polls-splash',
        subredditName: context.subredditName!,
        postData
    }))
    return res.json({
        showToast: { text: 'Poll post created', appearance: 'success' },
        navigateTo: pollPost
    })
})

export default formRouter