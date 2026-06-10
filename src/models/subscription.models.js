import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,//one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,//one who is subscribing
        ref: "User"
    }
}, { timestamps: true }) 
const SubscriptionModel = mongoose.model('SubscriptionModel', subscriptionSchema)
export default SubscriptionModel;