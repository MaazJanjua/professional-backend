import { Router } from 'express';
import {
    createOrder,
    getUserOrders,
    getUserOrders1,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrders,
    getAllMyOrders,
    deleteOrder 
} from '../controllers/order.controller.js';

import  verifyJWT  from '../middlewares/auth.middleware.js';
const router = Router();
router.use(verifyJWT);//apply veriftJWT middleware to all routes in this file

router.route('/')
    .post(createOrder)
    .get(getAllOrders);

router.route('/my-orders')
    .get(getUserOrders)
    .get(getUserOrders1)
    .get(getAllMyOrders)

router.route('/my-orders1')
    .get(getUserOrders1)


router.route('/:orderId')
    .get(getOrderById)
    .delete(deleteOrder);

router.route('/:orderId/cancel')
    .patch(cancelOrder);

router.route('/:orderId/status')
    .patch(updateOrderStatus);

router.route('/:orderId/payment-status')
    .patch(updatePaymentStatus);

export default router;