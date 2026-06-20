import { Router } from "express";

import {
    createPayment,
    verifyPayment,
    paymentWebhook,
    getPaymentByOrderId,
    getUserPayments,
    getpaymentById,
    updatePaymentStatus,
    confirmCODPayment,
    refundPayment

} from "../controllers/payment.controller.js";

import {
    viewLimiter,
    paymentLimiter,
    paymentVerifyLimiter,
    financialActionLimiter
} from '../middlewares/rateLimiter.middleware.js'


import verifyJWT from '../middlewares/auth.middleware.js'
const router = Router();

router.route('/webhook').post(paymentWebhook);

router.use(verifyJWT);

router.route('/')
    .post(paymentLimiter, createPayment)
    .get(viewLimiter, getUserPayments);

router.route('/verify').post(paymentVerifyLimiter, verifyPayment);

router.route('/confirm-cod').post(financialActionLimiter, confirmCODPayment);

router.route('/:orderId/refund').post(financialActionLimiter, refundPayment);

router.route('/order/:orderId').get(viewLimiter, getPaymentByOrderId);

router.route('/:paymentId')
    .get(viewLimiter, getpaymentById)
    .patch(financialActionLimiter, updatePaymentStatus);

export default router;