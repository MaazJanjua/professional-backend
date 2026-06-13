import mongoose from "mongoose";
import slugify from "slugify";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import Product from '../models/product.models.js';

const createProduct = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming req.user is set by auth middleware
    const { title, description, price, category, stock } = req.body;
    if (
        !title?.trim() || !description?.trim() || !category?.trim() || price == null || stock == null) {
        throw new apiError("All fields (title, description, price, category, stock) are required", 400)
    }

    if (price < 0 || stock < 0) {
        throw new apiError(400, "Price and stock cannot be negative");
    }

    if (!req.user?._id) {
        throw new apiError(401, "Unauthorized");
    }

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

    if (search) {
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
    if (!product) {
        throw new apiError(404, "Product not found")
    }
    return res
        .status(200)
        .json(new apiResponse(200, { product }, "Product fetched successfully"))
})

const getProductById = asyncHandler(async (req, res) => {

})
const updateProduct = asyncHandler(async (req, res) => { })
const deleteProduct = asyncHandler(async (req, res) => { })
const updateProductStock = asyncHandler(async (req, res) => { })
const addProductReview = asyncHandler(async (req, res) => { })
const getProductReviews = asyncHandler(async (req, res) => { })
const searchProducts = asyncHandler(async (req, res) => { })
const filterProducts = asyncHandler(async (req, res) => { })

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




//11 controllers functions for product management