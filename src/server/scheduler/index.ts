import { Router } from "express"
import { example_1_min_scheduler } from "./example-1-min-scheduler"

const scheduler: Router = Router()

scheduler.post('/example-1-min-scheduler', example_1_min_scheduler)

export default scheduler