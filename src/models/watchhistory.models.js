import mongoose, { Schema } from 'mongoose'

const watchHistorySchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
})
watchHistorySchema.index(
    {
        owner: 1,
        video: 1
    },
    {
        unique: true
    }
)
export const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema)