import { context, reddit, redis } from '@devvit/web/server';
import type { UiResponse } from '@devvit/web/shared';
import { Router } from 'express';
import { pollMeta, pollOptions, pollVotes } from '../redis/keys'
type PollForm = {
    flairId: string[];
    title: string;
    body: string;
    'poll-options': string;
    pollDurationDays: number;
    allowMultipleVotes: boolean;
}

type PollV2Form = {
    flairId: string[];
    title: string;
    'poll-options': string;
    pollDurationDays: number;
    allowMultipleVotes: boolean;
}

const formRouter = Router()

formRouter.post<string, never, UiResponse, PollForm>('/pollForm', async (req, res) => {
    const { flairId, title, body, 'poll-options': pollOptionsRaw, pollDurationDays, allowMultipleVotes } = req.body;
    const options = pollOptionsRaw.split(',').map((option: string) => option.trim());

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + Number(pollDurationDays));

    console.debug("flairId", flairId);
    console.debug("title", title);
    console.debug("body", body);
    console.debug("poll-options", options);
    console.debug("poll expiration timestamp (ISO)", expirationDate.toISOString());
    console.debug("allowMultipleVotes", allowMultipleVotes);

    const postData = {
        body,
        expirationTimestamp: expirationDate.toISOString(),
        allowMultipleVotes
    }

    const pollPost = await reddit.submitCustomPost(({
        flairId: flairId[0],
        title: title,
        entry: 'polls-splash',
        subredditName: context.subredditName!,
        postData
    }))
    await redis.hSet(pollMeta(pollPost.id),
        {
            expirationTimestamp: expirationDate.toISOString(),
            allowMultipleVotes: String(allowMultipleVotes)
        }
    )
    const optionRecord: Record<string, string> = {}
    options.forEach((option, index) => {
        optionRecord[String(index)] = option
    })
    await redis.hSet(pollOptions(pollPost.id), optionRecord)
    const voteRecord: Record<string, string> = {}
    options.forEach((_, index) => {
        voteRecord[String(index)] = '0'
    })
    await redis.hSet(pollVotes(pollPost.id), voteRecord)
    console.debug('Poll Post Id', pollPost.id)
    return res.json({
        showToast: { text: 'Poll post created', appearance: 'success' },
        navigateTo: pollPost
    })
})

formRouter.post<string, never, UiResponse, PollV2Form>('/poll-v2-Form', async (req, res) => {
    const { flairId, title, 'poll-options': pollOptionsRaw, pollDurationDays, allowMultipleVotes } = req.body;
    const options = pollOptionsRaw.split(',').map((option: string) => option.trim());

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + Number(pollDurationDays));

    const postData = {
        title,
        expirationTimestamp: expirationDate.toISOString(),
        allowMultipleVotes
    };

    const pollPost = await reddit.submitCustomPost({
        flairId: flairId?.[0],
        title: title,
        entry: 'polls-v2',
        subredditName: context.subredditName!,
        postData
    });

    await redis.hSet(pollMeta(pollPost.id), {
        expirationTimestamp: expirationDate.toISOString(),
        allowMultipleVotes: String(allowMultipleVotes)
    });

    const optionRecord: Record<string, string> = {};
    options.forEach((option, index) => {
        optionRecord[String(index)] = option;
    });
    await redis.hSet(pollOptions(pollPost.id), optionRecord);

    const voteRecord: Record<string, string> = {};
    options.forEach((_, index) => {
        voteRecord[String(index)] = '0';
    });
    await redis.hSet(pollVotes(pollPost.id), voteRecord);

    return res.json({
        showToast: { text: 'Poll v2 post created', appearance: 'success' },
        navigateTo: pollPost
    });
});

export default formRouter