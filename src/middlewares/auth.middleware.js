import config from '../config/config.js'
import User from '../models/user.models.js';
import apiError from "../utils/apiError.js"; 
import asyncHandler from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'


const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace('Bearer', "")

        if (!token) {
            throw new apiError(401, 'Unauthorizaed request')
        }
        const decodedToken = jwt.verify(token, config.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
         
            throw new apiError(401, 'invalid accessToken')
        }
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, error?.message || "invalid accessToken for logout")
    }
})
export default verifyJWT;