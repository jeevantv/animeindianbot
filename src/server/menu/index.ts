import { Router } from "express";
import { reddit, context } from "@devvit/web/server";
import type { UiResponse, MenuItemRequest } from "@devvit/web/shared";

const menuRouter = Router();
menuRouter.post<string, never, UiResponse, never>('/create-splash-post', async (_req, res) => {
    const subredditIcon = (await reddit.getCurrentSubreddit()).settings?.communityIcon;
    if (!subredditIcon) {
        throw new Error("Subreddit icon not found")
    }
    const post = await reddit.submitCustomPost(
        {
            subredditName: context.subredditName!,
            title: "Episode Schedule Dashbord",
            entry: "default",
            postData: {
                subredditIcon: subredditIcon,
            }
        }
    );
    return res.json({
        showToast: { text: `Post ${post.id} created.`, appearance: "success" },
        navigateTo: post,
    });
})


menuRouter.post<string, never, UiResponse, MenuItemRequest>('/create-poll-postForm', async (_req, res) => {
    const flairs = await reddit.getPostFlairTemplates(context.subredditName);
    return res.json({
        showForm: {
            name: 'pollForm',
            form: {
                title: "Create New Poll in Subreddit",
                fields: [
                    {
                        type: 'select',
                        label: 'Flair Id',
                        name: 'flairId',
                        options: flairs.map(item => ({ "label": item.text, "value": item.id })),
                        required: true
                    },
                    {
                        type: 'string',
                        label: 'Poll title',
                        name: 'title',
                        required: true
                    },
                    {
                        type: 'paragraph',
                        label: "Post body",
                        name: 'body',
                        required: true,
                    }, {
                        type: "paragraph",
                        label: 'Poll options',
                        name: 'poll-options',
                        required: true,
                        placeholder: 'after first poll option add , for second one',
                        helpText: 'ex: attack on titian S4,Demon Slayer S3,My Hero Academia'
                    },
                    {
                        type: 'number',
                        label: "Poll duration (in days)",
                        name: 'pollDurationDays',
                        required: true,
                        defaultValue: 3,
                        helpText: 'How many days should this poll remain open?'
                    },
                    {
                        type: 'boolean',
                        label: "allow multiple votes",
                        name: 'allowMultipleVotes',
                        defaultValue: false
                    }
                ],
                acceptLabel: "Create Poll",
                cancelLabel: "Cancel",
                description: "Fill this form to create a poll post in subreddit"
            }
        }
    })
})

export default menuRouter;
