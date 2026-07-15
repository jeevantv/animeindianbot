import { Router } from "express";
import { getScheduledJob, cancelJob, getEpisodeDetails } from "./epsiodeDashbord.js";
import { getPollData, castVotes, isMod, resetPollVotes } from "./polls.js";

const apiRouter = Router();

apiRouter.get('/epsiodeDashbord', getScheduledJob)
apiRouter.post('/cancelJob', cancelJob)
apiRouter.get('/episodeDetails', getEpisodeDetails)
apiRouter.get('/polls/data', getPollData)
apiRouter.post('/polls/vote', castVotes)
apiRouter.get('/polls/isMod', isMod)
apiRouter.post('/polls/reset', resetPollVotes)

export default apiRouter;