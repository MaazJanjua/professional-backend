import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js'
import Playlist from "../models/playlist.models.js";


const createPlatlist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!name?.trim() || !description?.trim()) {
        throw new apiError(400, 'name & description required')
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })
    if (!playlist) {
        throw new apiError(400, 'playlist creation operation failed')
    }
    return res
        .status(200)
        .json(new apiResponse(200, playlist, 'playlist created successfully'))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new apiError(400, 'user Id invalid')
    }
    const playlist = await Playlist.find({
        owner: userId
    }).populate("owner", 'username avatar thumbnail')
    if (!playlist) {
        throw new apiError(400, 'playlist invalid')
    }
    return res
        .status(200)

        .json(new apiResponse(200, playlist, 'getPlaylists Successfully'))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, 'playlist Id invalid')
    }
    const playlist = await Playlist.findById(playlistId)
        .populate("owner", 'username thumbnail avatar')
        .populate("videos")

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found')
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Playlist fetched successfully'))
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, 'playlistId/videoId invalid')
    }
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id

        },
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )
    if (!playlist) {
        throw new ApiError(404, 'Playlist not found or unauthorized')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'video add in playlist successfully'))
})

const removeVideoFormPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, 'invalid playlistId/videoId')
    }
    Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $pull: {
                videos: videoId
            }
        },
        { new: true }
    )
    if (!playlist) {
        throw new ApiError(404, 'playlist not found or unauthorized')
    }
    return res.status(200)
        .json(new ApiResponse(200, playlist, 'video deleted Successfully from playlist'))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, 'invalid playlistId')
    }
    const playlist = await Playlist.findOneAndDelete(
        {
            _id: playlistId,
            owner: req.user._id
        }
    )
    if (!playlist) {
        throw new ApiError(404, 'playlist not found or unauthorized')
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'playlist delete successfully'))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, 'playlistId is invalid'
        )
    }
    if (!name?.trim() || !description?.trim()) {
        throw new apiError(401, 'name/description is required')
    }
    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )
    if (!playlist) {
        throw new apiError(
            404, 'playlist not found or unauthorized'
        )
    }
    return res
        .status(200)
        .json(new apiResponse(200, playlist, 'playlist updated successfully'))
})

export {
    createPlatlist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFormPlaylist,
    deletePlaylist,
    updatePlaylist
}