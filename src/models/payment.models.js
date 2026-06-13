import mongoose, { Schema } from 'mongoose';
const paymentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true

    },
    order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true

    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "PKR"
    },
    paymentMethod: {
        type: String,
        enum: [
            "COD",
            "CARD",
            "JAZZCASH",
            "EASYPAISA",
            "UPAISA"
        ],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: [
            "pending",
            "paid", 
            "failed"
        ],
        default: "pending"
    },
    transactionId: {
        type: String
    }
},
    {
        timestamps: true
    })
const Payment = mongoose.model("Payment", paymentSchema)
export default Payment;