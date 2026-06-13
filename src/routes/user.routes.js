// Import Router from Express
import { Router } from "express";

// Import all user controllers
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
} from "../controllers/user.controller.js";

import { loginLimiter } from '../middlewares/rateLimiter.middleware.js'

// Multer middleware for handling file uploads
import upload from '../middlewares/multer.middleware.js'

// JWT authentication middleware
import verifyJWT from '../middlewares/auth.middleware.js'

// Cloudinary utility function
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create router instance
const router = Router();


// =========================
// Public Routes
// =========================


// Register User Route
// upload.fields() is used when multiple files are uploaded
router.route('/register').post(
    upload.fields([
        {
            // Avatar image upload
            name: "avatar",
            maxCount: 1
        },
        {
            // Cover image upload
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

// Login Route
router.route('/login').post(loginLimiter, loginUser)

// =========================
// Secured Routes
// These routes require JWT authentication
// =========================


// Logout current logged-in user
router.route("/logout").post(verifyJWT, logoutUser)

// Generate new access token using refresh token
router.route("/refresh-token").post(refreshAccessToken)

// Change current user's password
router.route('/change-password').post(verifyJWT, changePassword)

// Get current logged-in user details
router.route('/current-user').get(verifyJWT, getCurrentUser)

// Update account details like fullName, email, etc.
// PATCH is used for partial updates
router.route('/update-account').patch(verifyJWT, updateAccountDetail)

// Update user avatar
// upload.single() is used for single file upload
router.route("/avatar").patch(
    verifyJWT,
    upload.single('avatar'),
    updateUserAvatar
)

// Update user cover image
router.route("/coverImage").patch(
    verifyJWT,
    upload.single('coverImage'),
    updateUserCoverImage
)

// Get channel profile using username param
// Example: /c/maaz
// ':' means dynamic route parameter
router.route('/c/:username').get(verifyJWT, getUserChannelProfile)

// Get current user's watch history
router.route('/history').get(verifyJWT, getUserWatchHistory)

// Export router
export default router;