import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js';
import Like from '../models/like.models.js';
import Video from '../models/video.models.js';
import Comment from '../models/comment.models.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(400, 'invalid video')
    }

    const deleteLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id
    })
    if (deleteLike) {
        return res
            .status(200)
            .json(new apiResponse(200, { liked: false }, 'video unlike successfully'))
    }

    const createdLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })
    const likesCount = await Like.countDocuments({
        video: videoId
    })
    return res.status(200)
        .json(new apiResponse(200,
            {
                liked: true,
                likesCount
            },
            'video liked successfully'
        ))

})
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new apiError(400, 'invalid comment Id')
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new apiError(400, 'invalid comment')
    }
    const deleteCommentLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user._id
    })
    if (deleteCommentLike) {
        return res
            .status(200)
            .json(new apiResponse(200, { liked: false }, 'comment unlike successfully'))
    }
    const CommentLikeCreated = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })
    if (!CommentLikeCreated) {
        throw new apiError(400, 'like create operation failed')
    }
    const CommentLikeCount = await Like.countDocuments({
        comment: commentId
    })
    return res
        .status(200)
        .json(new apiResponse(200, {
            like: true,
            CommentLikeCount
        }, 'comment liked Succesfully'))
})
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, 'invalid tweet id')
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new apiError(400, 'invalid tweet')
    }
    const deleteTweetLike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: req.user._id
    })
    if (deleteTweetLike) {
        return res.status(200)
            .json(new apiResponse
                (200, { liked: false }, 'Tweet unlike successfully'))
    }
    const tweetLikeCreate = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })
    const tweetLikeCount = await Like.countDocuments({
        tweet: tweetId
    })
    return res
        .status(200)
        .json(new apiResponse(200, {
            liked: true,
            tweetLikeCount
        }, 'tweet liked successfully'))

})
const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const pageNumbers = parseInt(page)
    const limitNumbers = parseInt(limit)
    if (isNaN(pageNumbers) || pageNumbers < 1) {
        throw new apiError(400, 'invalid page Number')
    }
    if (isNaN(limitNumbers) || limitNumbers < 1) {
        throw new apiError(400, 'invalid limit Number')
    }
    const likedVideo = await Like.find(
        {
            likedBy: req.user._id,
            video: { $exists: true }
        }
    ).populate("video", "thumbnail title owner")
        .limit(limitNumbers)
        .skip((pageNumbers - 1) * limitNumbers)
        .sort({ createdAt: -1 })

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideo, 'liked video fetched successfully'))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} 