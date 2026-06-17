import mongoose, { Schema } from "mongoose";


const categorySchema = new Schema({

    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    image: {
        type: String
    },

    description: {
        type: String
    },

    isActive: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true
})


const Category = mongoose.model(
    "Category",
    categorySchema
)


export default Category;