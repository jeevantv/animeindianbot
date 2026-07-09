import { Router } from "express";
import { getScheduledJob, cancelJob, getEpisodeDetails } from "./epsiodeDashbord.js";

const apiRouter = Router();

apiRouter.get('/epsiodeDashbord', getScheduledJob)
apiRouter.post('/cancelJob', cancelJob)
apiRouter.get('/episodeDetails', getEpisodeDetails)
export default apiRouter;