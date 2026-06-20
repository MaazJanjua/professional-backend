import { Router } from "express";
import {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    syncCart,
    updateCartItemQuantity,
} from "../controllers/cart.controller.js";

//RATE LIMIT IMPORT
import {
    viewLimiter,
    cartLimiter
} from "../middlewares/rateLimiter.middleware.js";


import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

router.use(verifyJWT);

router.route('/')
    .get(viewLimiter, getCart)
    .delete(cartLimiter, clearCart)



router.route('/sync')
    .post(cartLimiter, syncCart)

router.route('/:productId')
    .delete(cartLimiter, removeFromCart)
    .patch(cartLimiter, updateCartItemQuantity)
    .post(cartLimiter, addToCart)

export default router;