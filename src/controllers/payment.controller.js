import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import Payment from '../models/payment.models.js';
import Order from '../models/order.models.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';






const createPayment = asyncHandler(async (req, res) => {

    const { orderId, paymentMethod } = req.body

    const order = Order.findById(orderId)

    if (!order) {
        throw new apiError(404, "Order not found")
    }

    //For security check: we have to verify (user)
    if (order.user.toString() !== req.user._id.toString()) {
        throw new apiError(403, "Unauthorized/You cannot pay this order")
    }

    // already paid?
    if (order.paymentStatus === "paid") {
        throw new apiError(400, "Order already paid")
    }

    const payment = await Payment.create({
        user: userId,
        order: order._id,
        amount: order.totalAmount,
        paymentMethod,
        paymentStatus: "pending"
    })

    order.payment = payment._id;
    await order.save();

    return res
        .status(201)
        .json(new apiResponse(
            201, payment, 'payment Created  successfully'
        ))
})
const verifyPayment = asyncHandler(async (req, res) => {

    const {
        paymentId,
        transactionId,
        gatewayStatus,
        gatewayAmount
    } = req.body


    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const payment = await Payment.findById(paymentId).session(session)

        if (!payment) {
            throw new apiError(404, "Payment not found")
        }

        // user authorization
        if (payment.user.toString() !== req.user._id.toString()) {
            throw new apiError(403, "Unauthorized payment access")
        }

        // already paid check
        if (payment.paymentStatus === "paid") {
            throw new apiError(400, "Payment already completed")

        }

        // gateway failed
        if (gatewayStatus !== "success") {
            payment.paymentStatus = "failed"
            await payment.save({ session })
            await session.commitTransaction()
            throw new apiError(400, "Payment failed")
        }

        const order = await Order.findById(payment.order).session(session)

        if (!order) {
            throw new apiError(404, "Order not found")
        }

        // amount verification

        if (Number(gatewayAmount) !== Number(order.totalAmount)) {
            throw new apiError(400, "Payment amount mismatch")
        }

        // update payment
        payment.paymentStatus = "paid"
        payment.transactionId = transactionId
        await payment.save({ session })

        // update order
        order.paymentStatus = "paid"
        order.orderStatus = "confirmed"
        await order.save({ session })

        await session.commitTransaction()

        return res
            .status(200)
            .json(new apiResponse(200, { payment, order },
                "Payment verified successfully"
            )
            )
    } catch (error) {

        await session.abortTransaction()
        throw error

    } finally {
        session.endSession()
    }
})

const getPaymentByOrderId = asyncHandler(async (req, res) => {
    const { orderId } = req.params

    // validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new apiError(400, 'invalid order id')
    }

    // find payment
    const payment = await Payment.findOne(
        { order: orderId }
    ).populate("order")

    // not found
    if (!payment) {
        throw new apiError(404, 'payment not found')
    }

    // ownership check
    if (payment.user.toString() !== req.user._id.toString()) {
        throw new apiError(403, 'unauthorized')
    }

    // return payment
    return res.status(200).json(
        new apiResponse(200,
            payment,
            'payment fetched by Id successfully'
        )
    )
})



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