import mongoose from "mongoose"
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import User from '../models/user.models.js'
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import apiResponse from '../utils/apiResponse.js'
import config from '../config/config.js'
import jwt from 'jsonwebtoken'
// import mongoose from 'mongoose'
// import { v2 as cloudinary } from 'cloudinary'

const cookiesOptions = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production"
    // sameSite: 'strict',
    // maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // Refresh Token DB Main Save
        user.refreshToken = refreshToken
        // Save User
        await user.save({ validateBeforeSave: false })
        // Return Tokens
        return { accessToken, refreshToken }

    } catch (error) {
        console.log(error.message)
        throw new apiError(500, 'Something Went Wrong While generating access and refresh token')
    }
}

// Register User Controller
const registerUser = asyncHandler(async (req, res) => {
    // Extract user data from request body
    const { fullName, username, email, password } = req.body
    // console.log(req.body);
    // console.log("email:", email);

    // ----------------------------------------------------
    // Validate Required Fields
    // Check if any input field is empty or contains only spaces
    // ----------------------------------------------------
    const fields = [fullName, username, email, password]
    if (fields.some((field) => !field?.trim())) {
        throw new apiError(400, "All fields are required")
    }
    // ----------------------------------------------------
    // Check if user already exists
    // Search user by username OR email
    // ----------------------------------------------------
    const existedUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (existedUser) {
        throw new apiError(
            409,
            "User already exists with this email or username"
        )
    }
    // console.log(req.files);

    // ----------------------------------------------------
    // Get local file paths from multer
    // Avatar is required
    // Cover image is optional
    // ----------------------------------------------------
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path 
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // Check if avatar file doesnot exists
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }
    // ----------------------------------------------------
    // Upload files to Cloudinary
    // ----------------------------------------------------
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(
        coverImageLocalPath
    ) : null
    // Check avatar upload success
    if (!avatar) {
        throw new apiError(400, "Failed to upload avatar")
    }
    // ----------------------------------------------------
    // Create user in database
    // ----------------------------------------------------
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })
    // ----------------------------------------------------
    // Remove sensitive fields before sending response
    // ----------------------------------------------------
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // Check if user creation failed
    if (!createdUser) {
        throw new apiError(
            500,
            "Something went wrong while registering user"
        )
    }
    // console.log(response);

    // ----------------------------------------------------
    // Send success response
    // ----------------------------------------------------
    return res
        .status(201)
        .json(
            new apiResponse(
                201,
                createdUser,
                "User registered successfully"
            )
        )
})

const loginUser = asyncHandler(async (req, res) => {
    //extrect data from forntend end email and password
    const { email, username, password } = req.body
    //validation in forntend data
    //if we need to go with anyone like with username/email

    // if (!(username || email)) {
    //     throw new apiError(400, 'username/email and password is required')
    // }

    // if we need with both username amd email

    if (!username && !email) {
        throw new apiError(400, 'username/email and password is required')
    }
    //User.findOne 
    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })
    if (!user) {
        throw new apiError(404, 'User doesnot exist')
    }
    //Passsword Verification
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new apiError(401, 'Password is incorrect')
    }
    // Access/Refresh token generate
    // Destructuring
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // cookie/session
    // const cookiesOption = {
    //     httpOnly: true,
    //     secure: true
    // }
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")
    //response bhjho
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookiesOptions)
        .cookie("refreshToken", refreshToken, cookiesOptions)
        .json(
            new apiResponse(200,
                {
                    user: loggedinUser,
                    accessToken,
                    refreshToken
                },
                "User LoggedIn Successfully ")
        )
    //error handling
})

const logoutUser = asyncHandler(async (req, res) => {
    // req.user._id
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this way we can remove completely the refresh token field from user document
            }
        }, {
        new: true
    }
    )
    // const cookiesOption = {
    //     httpOnly: true,
    //     secure: true
    // }
    return res
        .status(200)
        .clearCookie("accessToken", cookiesOptions)
        .clearCookie("refreshToken", cookiesOptions)
        .json(new apiResponse(200, {}, 'User LoggedOut Successfully'))


})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new apiError(401, 'unauthorized request')
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            config.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new apiError(401, 'invalid refresh token')
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, 'Refresh token is expired or used ')
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookiesOptions)
            .cookie("refreshToken", refreshToken, cookiesOptions)
            .json(new apiResponse(200, {
                accessToken, refreshToken
            },
                'AccessToken refreshed Successfully'))
    } catch (error) {
        throw new apiError(401, error?.message || "invalid refresh token")

    }


})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body
    if (newPassword !== confPassword) {
        throw new apiError(400, 'newPassword and confPassword should be equal')
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new apiError(401, 'Invalid Old Password')
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new apiResponse(200, {}, "Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                req.user,
                'User fetched successfully'
            )
        )
})

const updateAccountDetail = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName && !email) {
        throw new apiError(400, 'at least one field is required')
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select('-password')
    return res
        .status(200)
        .json(new apiResponse(200, user, 'Account Detailed Fetched Successfully'))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400, 'avatar Localfile is missing')
    }

    // existing user
    const existingUser = await User.findById(req.user._id)
    // upload new avatar on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new apiError(400, 'Error while uploading Avatar file ')
    }
    // update user avatar in DB
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar?.url
            }
        }, { new: true }
    ).select('-password')

    // =========================
    // delete old avatar
    // =========================
    if (existingUser?.avatar) {
        const oldImageUrl = existingUser.avatar
        //slit Url to get public_id
        const cleanUrl = oldImageUrl.split("?")[0]
        const parts = cleanUrl.split("/")
        // گرفتن file name => maaz.png
        const fileName = parts[parts.length - 1]
        // remove extension  => maaz
        const withoutExtension = fileName.split(".")[0]
        // folder name => users
        const folderName = parts[parts.length - 2]
        // final public_id => users/maaz
        const publicId = `${folderName}/${withoutExtension}`
        // delete from cloudinary
        await deleteFromCloudinary(publicId)

    }

    return res
        .status(200)
        .json(
            new apiResponse(200, user, 'Avatar updated successfully')
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    //multer middlware for reciving path 
    const coverImageLocalPath = req.file?.path
    //validation if file path exists
    if (!coverImageLocalPath) {
        throw new apiError(400, 'coverImage Localfile is missing')
    }
    //upload on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    //validation if we are not getting file`s url
    if (!coverImage?.url) {
        throw new apiError(400, 'error getting while uploading coverImage uploading')
    }
    // findByIdAndUpdate  
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage?.url

            }
        },
        { new: true }
    ).select('-password')
    return res
        .status(200)
        .json(
            new apiResponse(200, user, 'CoverImage updated successfully')
        )
})
// Easy Memory Trick
// Stage	Kaam
// $match	filter
// $lookup	join
// $addFields	new fields
// $project	final output
// $group	grouping
// $sort	sorting
// $limit	limit results


// SIMPLE FLOW
// 1. username lo
// 2. user find karo
// 3. uske subscribers nikalo
// 4. usne kin channels ko subscribe kiya woh nikalo
// 5. counts nikalo
// 6. current user subscribed hai ya nahi check karo
// 7. selected data return karo
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new apiError(400, 'username is missing')
    }
    // Aggregation ka matlab:
    // Data ko multiple stages me process karnaa jisse hum complex data transformations aur computations kar sakte hain. Har stage me hum data ko filter, group, sort, ya modify kar sakte hain. Ye MongoDB ke powerful features me se ek hai jo hume flexible aur efficient data retrieval ki suvidha deta hai.
    const channel = await User.aggregate([
        {
            // Ye database me woh user find karega jiska username match karta ho.
            $match: {
                username: username.toLowerCase()
            }
        },
        // Subscribers Lookup
        {
            $lookup: {
                from: 'subscriptionModels',
                localField: '_id',
                foreignField: 'channel',
                as: "subscribers"
            }
        },
        // Subscribed To Lookup
        {
            $lookup: {
                from: "subscriptionModels",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"

            }
        },
        // Add Extra Fields
        {
            $addFields: {
                subscribersCount: {
                    // $size array ki length batata hai. Yahan hum subscribers array ki length nikal rahe hain jisse hume pata chalega ki channel ke kitne subscribers hain.
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                // isSubscribed: {
                //     $cond: {
                //         if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                //         then: true,
                //         else: false
                //     }
                // }
                isSubscribed: {
                    $in: [
                        req.user?._id,
                        {
                            $map: {
                                input: "$subscribers",
                                as: "sub",
                                in: "$$sub.subscriber"
                            }
                        }
                    ]
                }
            }
        },
        {
            // Ye decide karta hai final response me kaunse fields bhejni hain.
            $project: {
                // 1 means include field. 0 means exclude field.
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    console.log(channel);
    if (!channel?.length) {
        throw new apiError(404, 'Channel not found / Channel doesnot exist')
    }
    return res
        .status(200)
        .json(new apiResponse(200, channel[0], 'User Channel profile fetched successfully'))
})

const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        }, {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: "watchHistory",
                pipeline: [{
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                    }
                }, {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
                ]
            }
        }
    ])



    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                user[0].watchHistory,
                "watchHistory Fetched Successfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory

}  