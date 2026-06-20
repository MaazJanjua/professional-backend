import { Router } from 'express';
import {
    createOrder,
    // getUserOrders,
    getUserOrders1,
    getOrderById,
    cancelOrder, 
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrders,
    getAllMyOrders,
    deleteOrder 
} from '../controllers/order.controller.js';

import {
    viewLimiter,
    orderLimiter,
    orderActionLimiter
} from '../middlewares/rateLimiter.middleware.js'

import verifyJWT from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT);//apply veriftJWT middleware to all routes in this file

// Create Order + All Orders
router.route('/')
    .post(orderLimiter, createOrder)
    .get(viewLimiter, getAllOrders);

// User Orders
router.route('/my-orders')
    // .get(viewLimiter, getUserOrders)
    .get(viewLimiter, getUserOrders1)
    .get(viewLimiter, getAllMyOrders)

router.route('/my-orders1')
    .get(viewLimiter, getUserOrders1)

// Specific Order
router.route('/:orderId')
    .get(viewLimiter, getOrderById)
    .delete(orderActionLimiter, deleteOrder);

// Cancel Order
router.route('/:orderId/cancel')
    .patch(orderActionLimiter, cancelOrder);

// Update Order Status (Admin)
router.route('/:orderId/status')
    .patch(orderActionLimiter, updateOrderStatus);

// Update Payment Status (Admin)
router.route('/:orderId/payment-status')
    .patch(orderActionLimiter, updatePaymentStatus);

export default router;