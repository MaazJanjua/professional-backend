import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Payment from '../models/payment.models.js';

const createPayment = asyncHandler(async (req, res) => { })
const verifyPayment = asyncHandler(async (req, res) => { })
const getPaymentByOrderId = asyncHandler(async (req, res) => { })
const getUserPayments = asyncHandler(async (req, res) => { })
const getpaymentById = asyncHandler(async (req, res) => { })
const updatePaymentStatus = asyncHandler(async (req, res) => { })
const confirmCODPayment = asyncHandler(async (req, res) => { })
const refundPayment = asyncHandler(async (req, res) => { })


export {
    createPayment, 
    verifyPayment, 
    getPaymentByOrderId,
    getUserPayments,
    getpaymentById,
    updatePaymentStatus, 
    confirmCODPayment,
    refundPayment
}
// 8 controllers functions for payment management