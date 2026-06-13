import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos
} from '../controllers/dsahboard.controller.js'

import verifyJWT from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT)

router.route("/channel-stats").get(getChannelStats);
router.route("/channel-videos").get(getChannelVideos)

export default router;