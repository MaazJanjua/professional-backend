import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

import Wishlist from '../models/wishlist.models.js';
import Product from '../models/product.models.js';

import {
    validateObjectId
} from '../utils/globalValidators.js'
import { validateWishlistExists } from "../utils/wishlistValidate.js";
import { validateProductExists } from '../utils/productValidator.js'

const addToWishlist = asyncHandler(async (req, res) => {
    //  Get productId from params
    const { productId } = req.params
    //  Validate product exists
    validateObjectId(productId, "product id")

    // product exists?
    const product = await Product.findById(productId);

    validateProductExists(product)

    //  Find/Create user wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id })

    if (!wishlist) {
        wishlist = await Wishlist.create({
            user: req.user._id,
            products: [productId]
        })
        wishlist = await Wishlist.findById(wishlist._id)
            .populate(
                "products",
                "title price images stock"
            );
        return res.status(201).json(
            new apiResponse(201, wishlist, "Wishlist created and product added")
        );
    } else {
        wishlist = await Wishlist.findOneAndUpdate(
            {
                user: req.user._id
            },
            {
                $addToSet: {
                    products: productId
                }
            },
            {
                new: true
            }).populate(
                "products",
                "title price images stock"
            )
    }

    //  Return updated wishlist
    return res.status(200).json(
        new apiResponse(200, wishlist, "Product added to wishlist")
    );
});

const removeFromWishlist = asyncHandler(async (req, res) => {
    //  Get productId
    const { productId } = req.params
    validateObjectId(productId, "product id")
    //  Find wishlist
    const wishlist = await Wishlist.findOneAndUpdate(
        {
            user: req.user._id
        },
        {  //$pull
            $pull: {
                products: productId
            }
        },
        {
            new: true
        })
    //  Remove product
    //  Save changes
    validateWishlistExists(wishlist)
    //  Return updated wishlist
    return res.status(200).json(
        new apiResponse(200, wishlist, "Product removed from wishlist")
    )
});

const getWishlist = asyncHandler(async (req, res) => {
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({
        user: req.user._id
    }).populate('products', "title price images stock")  // Populate products
    if (!wishlist) {
        return res.status(200).json(
            new apiResponse(
                200,
                { products: [] },
                "Wishlist fetched successfully"
            )
        );
    }

    // Return wishlist
    return res.json(new apiResponse(200, wishlist, 'Wishlist fetched successfully'))
});

const clearWishlist = asyncHandler(async (req, res) => {
    // Find wishlist
    const wishlist = await Wishlist.findOneAndUpdate(
        {
            user: req.user._id
        },
        {
            $set: {
                // Empty products array
                products: []
            }
        },
        { new: true })

    //validate wishlist exists
    validateWishlistExists(wishlist)

    // Return success response
    return res.status(200).json(
        new apiResponse(200, wishlist, 'wishlist clear successfully')
    )
});

export {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clearWishlist
};