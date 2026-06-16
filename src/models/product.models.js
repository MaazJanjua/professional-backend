import mongoose, { Schema } from 'mongoose'

const productSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    price: {
        type: Number, 
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        min: 0
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    images: [
        {
            url: String,
            public_id: String
        }
    ],
    category: {
        // type: Schema.Types.ObjectId,
        // ref: "Category",
        type:String,
        required: true
    },
    //if store is like marlet place | if your own store then you can remove it
    seller: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    averageRating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const Product = mongoose.model('Product', productSchema)
export default Product;