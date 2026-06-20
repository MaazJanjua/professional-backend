import { Router } from 'express';
import {
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
} from '../controllers/product.controller.js'

//RATE LIMITES IMPORTS
import {
    viewLimiter,
    commentLimiter,
    adminActionLimiter
} from '../middlewares/rateLimiter.middleware.js'


import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

// PUBLIC
router.route('/').get(viewLimiter, getAllProducts)
router.route('/search/:query').get(viewLimiter, searchProducts)
router.route("/filter").get(viewLimiter, filterProducts)
router.route("/slug/:slug").get(viewLimiter, getProductBySlug)
router.route("/:productId").get(viewLimiter, getProductById)

//REVIEWS
router.route('/:productId/reviews')
    .post(verifyJWT, commentLimiter, addProductReview)
    .get(viewLimiter, getProductReviews)

//PROTECTED (ADMIN) ROUTES
router.route('/').post(verifyJWT, adminActionLimiter, createProduct)
router.route('/:productId')
    .put(verifyJWT, adminActionLimiter, updateProduct)
    .delete(verifyJWT, adminActionLimiter, deleteProduct)
router.route('/:productId/stock').put(verifyJWT, adminActionLimiter, updateProductStock)

export default router;