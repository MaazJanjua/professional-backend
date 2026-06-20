import mongoose from "mongoose";
import slugify from "slugify";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import Product from '../models/product.models.js';
import Review from '../models/reviews.models.js';

import {
    validateObjectId
    
} from '../utils/globalValidators.js'

import {
    validateProductExists,
    validateCreateProductData 
} from '../utils/productValidator.js'

//update required product images  
const createProduct = asyncHandler(async (req, res) => {

    const userId = req.user._id; // Assuming req.user is set by auth middleware
    const { title, description, price, category, stock } = req.body;
    validateCreateProductData({
        title,
        description,
        price,
        category,
        stock
    })

    const product = await Product.create({
        title: title.trim(),
        slug: slugify(title, {
            lower: true
        }),
        description: description.trim(),
        price,
        category: category.trim(),
        stock,
        owner: userId
    })
    return res
        .status(201)
        .json(new apiResponse(201, {
            productId: product._id,
            title: product.title,
            price: product.price
        }, 'product created successfully'))
})

const getAllProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, category, search, sort } = req.query;

    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    if (pageNumber < 1 || limitNumber < 1) {
        throw new apiError(400, "Invalid pagination")
    }

    let filter = {};

    if (category) {
        filter.category = category
    }

    if (search?.trim()) {
        filter.title = { $regex: search, $options: 'i' }
    }

    let sortOption = {};

    if (sort === 'Price-Low-To-High') {
        sortOption.price = 1
    } else if (sort === 'Price-High-To-Low') {
        sortOption.price = -1
    } else {
        sortOption.createdAt = -1
    }

    const products = await Product.find(filter)
        .sort(sortOption)
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)

    return res
        .status(200)
        .json(new apiResponse(200, { products }, "Products fetched successfully"))

})

const getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params

    if (!slug) {
        throw new apiError(400, "Product slug is required")
    }

    const product = await Product.findOne({ slug })

    validateProductExists(product)

    return res
        .status(200)
        .json(new apiResponse(200, { product }, "Product fetched successfully"))

})

const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params

    validateObjectId(productId, 'product id')

    const product = await Product.findById(productId)

    validateProductExists(product)

    return res
        .status(200)
        .json(new apiResponse(200, product, 'product fetched by productId successfully'))
})

//update required product images 
const updateProduct = asyncHandler(async (req, res) => {

    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized")
    }

    const { productId } = req.params

    validateObjectId(productId, 'product id')

    const { title, description, price, category, stock } = req.body

    const updateData = {}

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim()
    if (category) updateData.category = category.trim()
    if (price != null) updateData.price = price;
    if (stock != null) updateData.stock = stock;

    if (title) {
        updateData.slug = slugify(title, { lower: true }) + "-" + productId;
    }

    const product = await Product.findOneAndUpdate({
        _id: productId,
        owner: req.user._id
    }, updateData,
        {
            new: true,
            runValidators: true
        }
    )

    validateProductExists(product)

    return res
        .status(200)
        .json(new apiResponse(200, { updatedProduct: product }, 'Product updated successfully'))
})

//update required product images 
const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params

    validateObjectId(productId, 'product id')

    const product = await Product.findOneAndDelete({
        _id: productId,
        owner: req.user._id
    })
    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized")
    }
    validateProductExists(product)
    return res
        .status(200)
        .json(new apiResponse(200, {
            deletedProduct: product._id
        }, 'Product deleted successfully'))
})

const updateProductStock = asyncHandler(async (req, res) => {
    const { productId } = req.params

    validateObjectId(productId, 'product id')

    const { stock } = req.body

    if (stock == null || isNaN(stock) || stock < 0) {
        throw new apiError(400, 'Invalid stock value')
    }

    const product = await Product.findOneAndUpdate(
        {
            _id: productId,
            owner: req.user._id
        },
        {
            stock
        },
        {
            new: true,
            runValidators: true
        }
    )

    validateProductExists(product)

    return res
        .status(200)
        .json(new apiResponse(200, product, 'product stock updated successfully'))

})

const addProductReview = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized")
    }
    const { productId } = req.params
    const { rating, comment } = req.body

    validateObjectId(productId, 'product id')

    const product = await Product.findById(productId);

    validateProductExists(product)

    if (!comment?.trim() || isNaN(rating) || rating == null || rating < 1 || rating > 5) {
        throw new apiError(400, 'Invalid rating. Please provide a rating between 1 and 5. Also, comment is required.')
    }

    const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating,
        comment: comment.trim()
    })
    if (!review) {
        throw new apiError(500, 'Failed to add review')
    }

    return res
        .status(201)
        .json(new apiResponse(201, { review }, 'review added successfully'))
})

const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params

    validateObjectId(productId, 'product id')

    const product = await Product.findById(productId)

    validateProductExists(product)

    const reviews = await Review.find({
        product: productId
    }).populate("user", "name avatar")

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { reviews },
                "All Reviews fetched successfully"
            )
        )

})

const searchProducts = asyncHandler(async (req, res) => {
    const { query } = req.params
    if (!query?.trim()) {
        throw new apiError(400, 'Search query is required')
    }
    const products = await Product.find({
        $or: [
            {
                title: {
                    $regex: query,
                    $options: 'i'
                }
            },
            {
                description: {
                    $regex: query,
                    $options: 'i'
                }
            },
            {
                category: {
                    $regex: query,
                    $options: 'i'
                }
            }
        ]
    })
    return res
        .status(200)
        .json(new apiResponse(200, products, 'product searched succesfully'))
})

const filterProducts = asyncHandler(async (req, res) => {
    const { category, minPrice, maxPrice } = req.query
    let filter = {}
    if (category) {
        filter.category = category;
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice)
        if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    const products = await Product.find(filter)

    return res.status(200).json(
        new apiResponse(
            200,
            { products },
            "Products filtered successfully")
    );
})

export {
    createProduct, // protected
    getAllProducts, // public
    getProductBySlug, // public  
    getProductById, // public
    updateProduct, // protected
    deleteProduct, // protected
    updateProductStock, // protected
    addProductReview, // public
    getProductReviews, // public
    searchProducts, // public
    filterProducts // public
}