import { Router } from "express";
import { daily_schedule_job } from "./daily-schedule-job";
import { post_episode_alarm } from "./post-episode-alarm";
import { museIndiaScheduler } from './muse-india-yt-rss-post'
const scheduler: Router = Router();

scheduler.post('/daily-schedule-job', daily_schedule_job);
scheduler.post('/post-episode-schedule', post_episode_alarm);
scheduler.post('/muse-india-yt-rss-post', museIndiaScheduler);


export default scheduler;