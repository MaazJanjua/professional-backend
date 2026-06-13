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
router.route('/search').get(searchProducts)
router.route("/filter").get(filterProducts)
router.route("/slug/:slug").get(getProductBySlug)
router.route("/:id").get(getProductById)

//REVIEWS
router.route('/:id/reviews').post(verifyJWT, addProductReview).get(getProductReviews)

//PROTECTED (ADMIN) ROUTES
router.route('/').post(verifyJWT, createProduct)
router.route('/:id').put(verifyJWT, updateProduct)
router.route('/:id').delete(verifyJWT, deleteProduct)
router.route('/:id/stock').put(verifyJWT, updateProductStock)

export default router;