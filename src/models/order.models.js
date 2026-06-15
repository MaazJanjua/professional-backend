import mongoose, { Schema } from 'mongoose'
const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderNumber: {
        type: String, 
        unique: true
    },

    items: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            title: {
                type: String,
                required: true
            },

            image: {
                type: String
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        name: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    orderStatus: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled"
        ],
        default: "pending"
    },
    payment: {
        type: Schema.Types.ObjectId,
        ref: "Payment"
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
    trackingNumber: {
        type: String
    }

}, { timestamps: true })
const Order = mongoose.model('Order', orderSchema)
export default Order;