import mongoose, { Schema } from 'mongoose'


const cartSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
                max: 100

            },

            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
})


const Cart = mongoose.model('Cart', cartSchema)
export default Cart;