import { Router } from 'express';
import {
    createPlatlist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFormPlaylist,
    deletePlaylist, 
    updatePlaylist
} from '../controllers/playlist.controller.js';

import verifyJWT from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlatlist); 
router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)
router.route('/add/:vieoId/:playlistId').patch(addVideoToPlaylist)
router.route('/add/:vieoId/:playlistId').patch(removeVideoFormPlaylist)
router.route('/user/:userId').get(getUserPlaylists)

export default router;
