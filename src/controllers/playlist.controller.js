import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'



const createPlatlist = asyncHandler(async (req, res) => { })

const getUserPlaylists = asyncHandler(async (req, res) => { })

const getPlaylistById = asyncHandler(async (req, res) => { })

const addVideoToPlaylist = asyncHandler(async (req, res) => { })

const removeVideoFormPlaylist = asyncHandler(async (req, res) => { })

const deletePlaylist = asyncHandler(async (req, res) => { })

const updatePlaylist = asyncHandler(async (req, res) => { })

export {
    createPlatlist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFormPlaylist,
    deletePlaylist,
    updatePlaylist
}