import { Router } from "express";

import {
    createPayment,
    verifyPayment,
    getPaymentByOrderId,
    getUserPayments,
    getpaymentById,
    updatePaymentStatus,
    confirmCODPayment,
    refundPayment

} from "../controllers/payment.controller.js";
import verifyJWT from '../middlewares/auth.middleware.js'

const router = Router();
router.use(verifyJWT); 

router.route('/')
    .post(createPayment)
    .get(getUserPayments);

router.route('/:paymentId')
    .get(getpaymentById) 
    .patch(updatePaymentStatus);

router.route('/verify')
    .post(verifyPayment);

router.route('/confirm-cod')
    .post(confirmCODPayment);

router.route('/:orderId/refund')
    .post(refundPayment);
    
router.route('/order/:orderId')
    .get(getPaymentByOrderId);

export default router;