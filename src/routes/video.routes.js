import { Router } from 'express';
import {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addVideoView
} from '../controllers/video.controller.js';

import viewLimiter from '../middlewares/rateLimiter.middleware.js'
import veriftJWT from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js'

const router = Router();

// Apply auth globally
router.use(veriftJWT);

// ================= ROUTES =================

// Get + Publish
router.route("/").get(getAllVideos).post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
)
// Single video CRUD
router.route('/:videoId').get(getVideoById).delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

// Toggle publish
router.route("/toggle/publish/:videoId")
    .patch(togglePublishStatus);

// Add view (rate limited)
router.route("/:videoId/view", viewLimiter,)


export default router;
