import mongoose from "mongoose"
import asyncHandler from '../utils/asyncHandler.js'
import Video from '../models/video.models.js'
import apiError from "../utils/apiError.js"
import apiResponse from '../utils/apiResponse.js'
import {
    uploadOnCloudinary,
    deleteFromCloudinary
} from '../utils/cloudinary.js'

import WatchHistory from '../models/watchhistory.models.js'
import { v2 as cloudinary } from "cloudinary"

import upload from '../middlewares/multer.middleware.js'

//VALIDATOR IMPORTS
import { validateYoutubeExists } from '../utils/youtubeGalobalValidator.js';
import {
    validateObjectId,
    validatePagination
} from '../utils/globalValidators.js';




const getAllVideos = asyncHandler(async (req, res) => {


})

const publishVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new apiError(400, 'title and description must be required')
    }

    const videoThumbnailPath = req.files.thumbnail?.[0]?.path

    const videoFilePath = req.files.videoFile?.[0]?.path

    if (!videoThumbnailPath || !videoFilePath) {
        throw new apiError(400, 'thumbnail & video is required/invalid')
    }

    const thumbnail = await uploadOnCloudinary(videoThumbnailPath);

    const video = await uploadOnCloudinary(videoFilePath)

    if (!thumbnail || !video) {
        throw new apiError(400, 'thumbnail or video upload failed')
    }

    const createdVideo = await Video.create({
        videoFile: {
            url: video.secure_url,
            public_id: video.public_id
        },
        thumbnail: {
            url: thumbnail.secure_url,
            public_id: thumbnail.public_id
        },
        description,
        title,
        duration: video.duration,
        owner: req.user._id,
        isPublished: true
    })

    if (!createdVideo) {
        throw new apiError(500, 'video Creation procasses failed')
    }

    return res
        .status(201)
        .json(new apiResponse(201, createdVideo, 'video published successfully'))
})

const addVideoView = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    const userId = req.user._id;

    // 1. Validate videoId
    validateObjectId(videoId, "video id")

    /**
     * 2. Atomically create watch history (only first time)
     * 
     * upsert = true:
     * - agar record nahi hai → create hoga
     * - agar already hai → kuch change nahi hoga
     */
    const historyResult = await WatchHistory.updateOne(
        { owner: userId, video: videoId },
        { $setOnInsert: { viewedAt: new Date() } },
        { upsert: true }
    );

    /**
     * 3. IMPORTANT:
     * upsertedCount === 1 means:
     * → first time user is watching this video
     */
    if (historyResult.upsertedCount === 1) {
        await Video.findByIdAndUpdate(
            videoId,
            {
                // increment view only once per user
                $inc: { views: 1 }
            }
        );
    }

    return res.status(200).json(
        new apiResponse(
            200,
            {},
            "View processed successfully"
        )
    );
});

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    validateObjectId(videoId, "video id")

    const video = await Video.findById(videoId)

    validateYoutubeExists(video)

    return res.status(200).json(
        new apiResponse(200, video)
    );
})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    const { title, description } = req.body

    validateObjectId(videoId, "video id")

    if (!title?.trim() || !description?.trim()) {
        throw new apiError(400, 'title and description is required')
    }

    const video = await Video.findOne({
        _id: videoId,
        owner: req.user._id
    })

    validateYoutubeExists(video)

    let newThumbnail = video.thumbnail

    if (req.files?.thumbnail?.[0]?.path) {

        const upload = await uploadOnCloudinary(
            req.files.thumbnail[0].path
        )

        if (!upload) {
            throw new apiError(500, "Thumbnail upload failed")
        }

        if (video.thumbnail?.public_id) {
            await deleteFromCloudinary(video.thumbnail.public_id)
        }
        newThumbnail = {
            url: upload.secure_url,
            public_id: upload.public_id
        }
    }
    video.title = title || video.title
    video.description = description || video.description
    video.thumbnail = newThumbnail
    await video.save()

    return res
        .status(200)
        .json(new apiResponse(200, video, 'video updated successfully'))
})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    validateObjectId(videoId, "video id")

    const video = await Video.findOne({
        _id: videoId,
        owner: req.user._id
    })

    validateYoutubeExists(video)

    if (video.videoFile?.public_id) {
        await deleteFromCloudinary(
            video.videoFile.public_id,
            { resource_type: 'video' }
        )
    }

    if (video.thumbnail?.public_id) {
        await deleteFromCloudinary(video.thumbnail?.public_id,)
    }

    await Video.deleteOne({
        _id: videoId,
        owner: req.user._id
    })

    validateYoutubeExists(video)

    return res
        .status(200)
        .json(new apiResponse(200, video, 'video deleted successfully'))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    validateObjectId(videoId, "video id")

    const video = await Video.findOneAndUpdate({
        owner: req.user._id,
        _id: videoId
    },
        [{
            $set: {
                isPublished: { $eq: [false, "$isPublished"] }
            }
        }],
        {
            new: true
        }
    )

    validateYoutubeExists(video)

    return res
        .status(200)
        .json(new apiResponse(200, video, 'videoPublish Toggled successfully'))
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addVideoView
}