import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js'
// import user from '../controllers/user.controller.js'
// import User from '../models/user.models.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import Comment from '../models/comment.models.js'
import Video from '../models/video.models.js'

//validator imports
import {
    validateObjectId,
    validatePagination
} from '../utils/globalValidators.js'
import {
    validateCommentExists,
    validateYoutubeExists
} from '../utils/youtubeGalobalValidator.js'


const getVideoComments = asyncHandler(async (req, res) => {
    //videoId from params
    const { videoId } = req.params
    validateObjectId(videoId, 'video id')
    //page limit
    const { page = 1, limit = 10 } = req.query
    //convert string into digit
    const { pageNumber, limitNumber } = validatePagination(page, limit)

    //find video jiss k comment get kerney ho 
    const comments = await Comment.find({ video: videoId })
        .populate('owner', 'username fullName avatar')
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .sort({ createdAt: - 1 })
    //response send 
    return res
        .status(200)
        .json(new apiResponse(200, comments, 'comments fetched successfully'))
});

const addComment = asyncHandler(async (req, res) => {
    //video jiss per comment ho ga 
    const { videoId } = req.params

    validateObjectId(videoId, 'video id')

    //user jo comment keray ga
    const user = req.user

    //comment ka content kya ho ga 
    const { content } = req.body

    //validation 
    if (!content?.trim() || !user) {
        throw new apiError(400, 'content/user not found for addComment')
    }

    //find video by videoId
    const video = await Video.findById(videoId)

    validateYoutubeExists(youtube)

    //create comment
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    const populatedComment = await Comment.findById(comment._id)
        .populate("owner", "username avatar")  //populate

    //response 
    return res
        .status(200)
        .json(new apiResponse(200, populatedComment, 'Comment added successfully'))
});

const updateComment = asyncHandler(async (req, res) => {
    //commentId from params
    const { commentId } = req.params

    validateObjectId(commentId, 'comment id')
    //content jo upate kerna ha 
    const { content } = req.body
    if (!content?.trim()) {
        throw new apiError(400, "Content is required")
    }
    //user khud apna commetn update ker sakey na k koi bhi random banda 
    const comment = await Comment.findById(commentId)

    validateCommentExists(comment)

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, 'Not authorized')
    }
    // findByIdAndUpdate  new:true
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    ).populate("owner", "username avatar")
    //populate
    //response send 
    return res
        .status(200)
        .json(new apiResponse(200, updatedComment, 'Comment Updated Successfully'))

});

const deleteComment = asyncHandler(async (req, res) => {
    //get commentId
    const { commentId } = req.params
    //validation if commentId is not correct then throw error
    validateObjectId(commentId, 'comment id')
    //findByIdAndDelete
    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })
    //validation if we not find 
    validateCommentExists(comment)
    //res send
    return res
        .status(200)
        .json(new apiResponse(200, comment, 'Comment delete successfully'))
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};