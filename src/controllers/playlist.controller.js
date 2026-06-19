import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js'
import Playlist from "../models/playlist.models.js";

// VALIDATOR IMPORTS
import { validatePlaylistExists } from '../utils/youtubeGalobalValidator.js';
import { validateObjectId } from '../utils/globalValidators.js';


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

    validatePlaylistExists(playlist)

    return res
        .status(200)
        .json(new apiResponse(200, playlist, 'playlist created successfully'))
})

const getUserPlaylists = asyncHandler(async (req, res) => {

    const { userId } = req.params

    validateObjectId(userId, 'user id')

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

    validateObjectId(playlistId, 'playlist id')

    const playlist = await Playlist.findById(playlistId)
        .populate("owner", 'username thumbnail avatar')
        .populate("videos")

    validatePlaylistExists(playlist)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'Playlist fetched successfully'))
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {

    const { playlistId, videoId } = req.params

    validateObjectId(playlistId, 'playlist id')

    validateObjectId(videoId, 'video id')

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

    validateObjectId(playlistId, 'playlist id')

    validateObjectId(videoId, 'video id')

    const playlist = await Playlist.findOneAndUpdate(
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

    validatePlaylistExists(playlist)

    return res.status(200)
        .json(new ApiResponse(200, playlist, 'video deleted Successfully from playlist'))

})

const deletePlaylist = asyncHandler(async (req, res) => {

    const { playlistId } = req.params

    validateObjectId(playlistId, 'playlist id')

    const playlist = await Playlist.findOneAndDelete(
        {
            _id: playlistId,
            owner: req.user._id
        }
    )

    validatePlaylistExists(playlist)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, 'playlist delete successfully'))

})

const updatePlaylist = asyncHandler(async (req, res) => {

    const { playlistId } = req.params

    const { name, description } = req.body

    validateObjectId(playlistId, 'playlist id')

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

    validatePlaylistExists(playlist)

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