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

import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

// PUBLIC
router.route('/').get(getAllProducts)
router.route('/search/:query').get(searchProducts)
router.route("/filter").get(filterProducts)
router.route("/slug/:slug").get(getProductBySlug)
router.route("/:productId").get(getProductById)

//REVIEWS
router.route('/:productId/reviews').post(verifyJWT, addProductReview).get(getProductReviews)

//PROTECTED (ADMIN) ROUTES
router.route('/').post(verifyJWT, createProduct)
router.route('/:productId').put(verifyJWT, updateProduct)
router.route('/:productId').delete(verifyJWT, deleteProduct)
router.route('/:productId/stock').put(verifyJWT, updateProductStock)

export default router;