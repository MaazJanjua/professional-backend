import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import config from '../config/config.js';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'password is required'],
    },
    refreshToken: {
        type: String
    }

}, { timestamps: true })

userSchema.pre("save", async function () {
    if (!this.isModified('password')) return ;

    this.password = await bcrypt.hash(this.password, 10);
    // next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email, //this.value database say aarahi ha 
        username: this.username,
        fullName: this.fullName
    },
        config.ACCESS_TOKEN_SECRET,
        { expiresIn: config.ACCESS_TOKEN_EXPIRY })
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
        config.REFRESH_TOKEN_SECRET,
        {
            expiresIn: config.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model('User', userSchema)
export default User;