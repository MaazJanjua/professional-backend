import { Router } from "express";

import {
    createPayment,
    verifyPayment,
    paymentWebhook,
    getPaymentByOrderId,
    getUserPayments,
    getPaymentById,
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

router.route('/confirm-cod/:orderId').post(financialActionLimiter, confirmCODPayment);

router.route('/:paymentId/refund').post(financialActionLimiter, refundPayment);

router.route('/order/:orderId').get(viewLimiter, getPaymentByOrderId);

router.route('/:paymentId')
    .get(viewLimiter, getPaymentById)
    .patch(financialActionLimiter, updatePaymentStatus);

export default router;