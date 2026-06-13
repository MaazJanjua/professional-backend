import { Router } from "express";
import { getCart, addToCart, removeFromCart, clearCart, syncCart, updateCartItemQuantity, } from "../controllers/cart.controller.js";

import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

router.use(verifyJWT);

router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart)

router.route('/sync')
    .post(syncCart)

router.route('/:productId') 
    .delete(removeFromCart)
    .patch(updateCartItemQuantity)

export default router;