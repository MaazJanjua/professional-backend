import mongoose, { mongo } from 'mongoose';
import Tweet from '../models/tweet.models.js';
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js'



const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    if (!content?.trim()) {
        throw new apiError(400, 'content is required for create tweet')
    }
    const tweet = await Tweet.create({
        owner: req.user._id,
        content: content.trim()
    })
    if (!tweet) {
        throw new apiError(400, 'tweet creation process failed')
    }
    return res
        .status(200)
        .json(new apiResponse(200, tweet, 'tweet created successfully'))
})


const getUserTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const pageNumbers = await parseInt(page)
    const limitNumbers = await parseInt(limit)

    if (isNaN(pageNumbers) || pageNumbers < 1) {
        throw new apiError(400, 'pageNumber invalid')
    }

    if (isNaN(limitNumbers) || limitNumbers < 1) {
        throw new apiError(400, 'limitNumbers invalid')
    }

    const tweets = await Tweet.find({
        owner: req.user._id
    })
        .populate("owner", 'username avatar')
        .lean()
        .limit(limitNumbers)
        .skip((pageNumbers - 1) * limitNumbers)
        .sort({ createdAt: - 1 })
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, 'User tweets fetched successfully'))

})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { tweetId } = req.params

    if (!content?.trim()) {
        throw new apiError(400, 'content is requiredfor update tweet')
    }
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, 'tweet Id invalid')
    }
    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id
        },
        {
            $set: {
                content: content.trim()
            }
        }, {
        new: true
    }
    )
    if (!tweet) {
        throw new ApiError(404, 'tweet not found')
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, 'tweet updated successfully'))

})

const deleteTweets = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, 'invalid tweetId')
    }
    const tweet = await Tweet.findOneAndDelete({
        owner: req.user._id,
        _id: tweetId,
    })
    if (!tweet) {
        throw new ApiError(404, 'tweet not found')
    }
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, 'tweet deleted successfully'))

})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweets
}