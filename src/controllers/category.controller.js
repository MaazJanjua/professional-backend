import mongoose from "mongoose";
import Category from "../models/category.models.js"

import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

//validator imports
import {
    validateObjectId
} from '../utils/globalValidators.js';
import {
    categoryExists
} from '../utils/categoryValidator.js';

const createCategory = asyncHandler(async (req, res) => {
    const { title, slug, image, description } = req.body;

    if (!title || !slug) {
        throw new apiError(400, "Name and slug are required");
    }

    const existingCategory = await Category.findOne({
        $or: [
            { title: title.trim() },
            { slug: slug.trim().toLowerCase() }
        ]
    });

    if (existingCategory) {
        throw new apiError(409, "Category with this name or slug already exists");
    }

    const category = await Category.create({
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        image,
        description
    });

    return res.status(201).json(
        new apiResponse(201, category, "Category created successfully")
    );
});

const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find()
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new apiResponse(
            200,
            categories,
            "Categories fetched successfully"
        )
    );
});

const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    validateObjectId(categoryId, 'category id')

    const category = await Category.findById(categoryId);

    categoryExists(category)

    return res.status(200).json(
        new apiResponse(200, category, "Category fetched successfully")
    );
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const category = await Category.findOne({
        slug: slug.toLowerCase()
    });

    categoryExists(category)

    return res.status(200).json(
        new apiResponse(200, category, "Category fetched successfully")
    );
});

const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    validateObjectId(categoryId, 'category id')

    const category = await Category.findById(categoryId);

    categoryExists(category)

    const { name, slug, image, description } = req.body;

    if (name) {
        const existingName = await Category.findOne({
            name: name.trim(),
            _id: { $ne: categoryId }
        });

        if (existingName) {
            throw new apiError(409, "Category name already exists");
        }

        category.name = name.trim();
    }

    if (slug) {
        const existingSlug = await Category.findOne({
            slug: slug.trim().toLowerCase(),
            _id: { $ne: categoryId }
        });

        if (existingSlug) {
            throw new apiError(409, "Category slug already exists");
        }

        category.slug = slug.trim().toLowerCase();
    }

    if (image !== undefined) {
        category.image = image;
    }

    if (description !== undefined) {
        category.description = description;
    }

    await category.save();

    return res.status(200).json(
        new apiResponse(200, category, "Category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    validateObjectId(categoryId, 'category id')

    const category = await Category.findById(categoryId);

    categoryExists(category)

    await category.deleteOne();

    return res.status(200).json(
        new apiResponse(200, {}, "Category deleted successfully")
    );
});

const toggleCategoryStatus = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    validateObjectId(categoryId, 'category id')

    const category = await Category.findById(categoryId);

    categoryExists(category)

    category.isActive = !category.isActive;

    await category.save();

    return res.status(200).json(
        new apiResponse(200, category, "Category status updated successfully")
    );
});

export {
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};