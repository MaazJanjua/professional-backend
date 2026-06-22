import { Router } from "express";

import {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clearWishlist
} from "../controllers/wishlist.controller.js";

import  verifyJWT  from "../middlewares/auth.middleware.js";

const router = Router();

// Protected Routes
router.use(verifyJWT);

// Get User Wishlist
router.route("/")
    .get(getWishlist)
    .delete(clearWishlist);

// Add / Remove Product
router.route("/:productId")
    .post(addToWishlist)
    .delete(removeFromWishlist);

export default router;