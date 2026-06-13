import { Router } from 'express';
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js';

import { commentLimiter } from '../middlewares/rateLimiter.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT);//apply veriftJWT middleware to all routes in this file

router.route('/:videoId')
    .get(commentLimiter, getVideoComments)
    .post(commentLimiter, addComment);

router.route("/:commentId")
    .delete(commentLimiter, deleteComment)
    .patch(commentLimiter, updateComment)


export default router;