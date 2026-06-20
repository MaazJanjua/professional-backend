import apiError from './apiError.js';

const validateCommentExists = (comment) => {
    if (!comment) {
        throw new apiError(404, 'Comment not found')
    }
}
const validateYoutubeExists = (youtube) => {
    if (!video) {
        throw new apiError(404, 'Video not found')
    }
}
const validateTweetExists = (tweet) => {
    if (!tweet) {
        throw new apiError(404, 'tweet not found')
    }
}
const validatePlaylistExists = (playlist) => {
    if (!playlist) {
        throw new apiError(404, 'playlist not found')
    }
}

export {
    validateCommentExists,
    validateYoutubeExists,
    validateTweetExists, 
    validatePlaylistExists
}