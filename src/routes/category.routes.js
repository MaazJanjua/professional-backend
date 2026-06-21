import { Router } from "express";

import {
    createCategory,
    getAllCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
} from "../controllers/category.controller.js";

import {
    viewLimiter,
    adminActionLimiter
} from "../middlewares/rateLimiter.middleware.js";

import verifyJWT from "../middlewares/auth.middleware.js";
import verifyAdmin from '../middlewares/admin.middleware.js'
const router = Router();

// PUBLIC ROUTES
router.route("/").get(viewLimiter, getAllCategories);

router.route("/slug/:slug").get(viewLimiter, getCategoryBySlug);

router.route("/:categoryId").get(viewLimiter, getCategoryById);


// PROTECTED ROUTES
router.use(verifyJWT);
// router.use(verifyAdmin)

router.route("/").post(adminActionLimiter, createCategory);

router.route("/:categoryId")
    .put(adminActionLimiter, updateCategory)
    .delete(adminActionLimiter, deleteCategory);

router.route("/:categoryId/toggle-status").patch(adminActionLimiter, toggleCategoryStatus);

export default router;