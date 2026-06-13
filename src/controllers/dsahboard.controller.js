import mongoose, { mongo } from 'mongoose'

import apiResponse, { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"



const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const stats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $facet: {
                totalVideos: [
                    { $count: "count" }
                ],
                totalViews: [
                    {
                        $group: {
                            _id: null,
                            views: {
                                $sum: '$views'
                            }
                        }
                    }

                ],
                totalLikes: [
                    {
                        $project: {
                            likesCount: { $size: "$likes" }
                        }
                    }, {
                        $group: {
                            _id: null,
                            likes: { $sum: "likesCount" }
                        }
                    }

                ]
            }
        }
    ])
})
const results = stats[0];
return res.status(200)
    .json(new apiResponse(200, results, 'Channel stats fetched succesfully'))


const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const videos = await Video.aggregate([
        {

            $match: {
                owner: new mongoose.Types.ObjectId.isValid(userId)
            }
        },
        {
            #sort: { createdAt: -1 }
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                views: 1,
                likes: { $size: "$likes" },
                createdAt: -1
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200, videos, 'channel videos fetched successfully')
    )
})
export {
    getChannelStats,
    getChannelVideos
}