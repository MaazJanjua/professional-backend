import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'

const createProduct = asyncHandler(async (req, res) => { })
const getAllProducts = asyncHandler(async (req, res) => { })
const getProductBySlug = asyncHandler(async (req, res) => { })
const getProductById = asyncHandler(async (req, res) => { })
const updateProduct = asyncHandler(async (req, res) => { })
const deleteProduct = asyncHandler(async (req, res) => { })
const updateProductStock = asyncHandler(async (req, res) => { })
const addProductReview = asyncHandler(async (req, res) => { })
const getProductReviews = asyncHandler(async (req, res) => { })
const searchProducts = asyncHandler(async (req, res) => { })
const filterProducts = asyncHandler(async (req, res) => { })

export {
    createProduct,
    getAllProducts, 
    getProductBySlug,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductStock,
    addProductReview,
    getProductReviews,
    searchProducts,
    filterProducts
}