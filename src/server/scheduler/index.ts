import { Router } from "express";
import { daily_schedule_job } from "./daily-schedule-job.js";
import { post_episode_alarm } from "./post-episode-alarm.js";

const scheduler: Router = Router();

scheduler.post('/daily-schedule-job', daily_schedule_job);
scheduler.post('/post-episode-alarm', post_episode_alarm);

export default scheduler;