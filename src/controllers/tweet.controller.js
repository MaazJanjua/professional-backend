import mongoose, { mongo } from 'mongoose';
import Tweet from '../models/tweet.models.js';
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js'

import { validateTweetExists } from '../utils/youtubeGalobalValidator.js';
import { validateObjectId } from '../utils/globalValidators.js';



const createTweet = asyncHandler(async (req, res) => {

    const { content } = req.body

    if (!content?.trim()) {
        throw new apiError(400, 'content is required for create tweet')
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content: content.trim()
    })

    validateTweetExists(tweet)

    return res
        .status(200)
        .json(new apiResponse(200, tweet, 'tweet created successfully'))
})


const getUserTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query


    const { pageNumber, limitNumber } = validatePagination(page, limit)


    const tweets = await Tweet.find({
        owner: req.user._id
    })
        .populate("owner", 'username avatar')
        .lean()
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
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

    validateObjectId(tweetId, 'tweet id')

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
    })

    validateTweetExists(tweet)

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, 'tweet updated successfully'))
})

const deleteTweets = asyncHandler(async (req, res) => {

    const { tweetId } = req.params

    validateObjectId(tweetId, 'tweet id')

    const tweet = await Tweet.findOneAndDelete({
        owner: req.user._id,
        _id: tweetId,
    })

    validateTweetExists(tweet)

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