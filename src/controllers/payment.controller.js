import mongoose from 'mongoose';
import crypto from "crypto";
import asyncHandler from '../utils/asyncHandler.js';
import Payment from '../models/payment.models.js';
import Order from '../models/order.models.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';




const createPayment = asyncHandler(async (req, res) => {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new apiError(400, "Invalid order id");
    }

    const allowedMethods = [
        "COD",
        "CARD",
        "JAZZCASH",
        "EASYPAISA",
        "UPAISA"
    ];

    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
        throw new apiError(400, "Invalid payment method");
    }

    const session = await mongoose.startSession();

    try {

        await session.startTransaction();

        const order = await Order.findById(orderId)
            .session(session);

        if (!order) {
            throw new apiError(404, "Order not found");
        }

        // Ownership check
        if (order.user.toString() !== userId.toString()) {
            throw new apiError(
                403,
                "Unauthorized. You cannot pay for this order."
            );
        }

        // Order validations
        if (order.orderStatus === "cancelled") {
            throw new apiError(
                400,
                "Cannot create payment for a cancelled order"
            );
        }

        if (order.orderStatus === "delivered") {
            throw new apiError(
                400,
                "Order already delivered"
            );
        }

        if (order.paymentStatus === "paid") {
            throw new apiError(
                400,
                "Order is already paid"
            );
        }

        if (
            typeof order.totalAmount !== "number" ||
            order.totalAmount <= 0
        ) {
            throw new apiError(
                400,
                "Invalid order amount"
            );
        }

        // Existing payment check
        const existingPayment = await Payment.findOne({
            order: order._id
        }).session(session);

        if (existingPayment) {

            // Retry failed payment
            if (existingPayment.paymentStatus === "failed") {

                existingPayment.paymentMethod =
                    paymentMethod;

                existingPayment.paymentStatus =
                    "pending";

                existingPayment.transactionId =
                    undefined;

                existingPayment.paidAt =
                    undefined;

                existingPayment.refundedAt =
                    undefined;

                existingPayment.refundReason =
                    undefined;

                existingPayment.gatewayReference =
                    crypto.randomUUID();

                await existingPayment.save({
                    session
                });

                order.paymentStatus = "pending";

                order.payment =
                    existingPayment._id;

                await order.save({
                    session
                });

                await session.commitTransaction();

                return res.status(200).json(
                    new apiResponse(
                        200,
                        existingPayment,
                        "Failed payment reset successfully. Retry initiated."
                    )
                );
            }

            throw new apiError(
                400,
                "Payment already exists for this order"
            );
        }

        // First payment creation
        const paymentDocs = await Payment.create(
            [
                {
                    user: userId,
                    order: order._id,
                    amount: order.totalAmount,
                    paymentMethod,
                    paymentStatus: "pending",
                    gatewayReference:
                        crypto.randomUUID()
                }
            ],
            { session }
        );

        const payment = paymentDocs[0];

        order.payment = payment._id;
        order.paymentStatus = "pending";

        await order.save({
            session
        });

        await session.commitTransaction();

        return res.status(201).json(
            new apiResponse(
                201,
                payment,
                "Payment created successfully"
            )
        );

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;

    } finally {

        await session.endSession();

    }
});



const verifyPayment = asyncHandler(async (req, res) => {
    const {
        paymentId,
        transactionId,
        gatewayStatus,
        gatewayAmount
    } = req.body;

    // Basic Validations
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new apiError(400, "Invalid payment id");
    }

    const allowedGatewayStatuses = [
        "success",
        "failed"
    ];

    if (!allowedGatewayStatuses.includes(gatewayStatus)) {
        throw new apiError(400, "Invalid gateway status"
        );
    }

    if (gatewayAmount === undefined ||
        gatewayAmount === null ||
        Number(gatewayAmount) <= 0
    ) {
        throw new apiError(400, "Invalid gateway amount"
        );
    }

    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        // Fetch Payment
        const payment = await Payment.findById(
            paymentId
        ).session(session);

        if (!payment) {
            throw new apiError(404, "Payment not found");
        }

        // Ownership Check
        if (payment.user.toString() !== req.user._id.toString()) {
            throw new apiError(403, "Unauthorized payment access");
        }

        // Payment Status Checks
        if (payment.paymentStatus === "paid") {
            throw new apiError(400, "Payment already completed");
        }

        if (["cancelled", "refunded", "failed"].includes(payment.paymentStatus)) {
            throw new apiError(400, `Payment is ${payment.paymentStatus}`);
        }

        // Transaction ID Validation
        if (payment.paymentMethod !== "COD" && !transactionId?.trim()) {
            throw new apiError(400, "Transaction ID is required");
        }

        // Duplicate Transaction Check
        if (payment.paymentMethod !== "COD" && transactionId) {
            const existingTransaction = await Payment.findOne({
                transactionId
            }).session(session);

            if (existingTransaction &&
                existingTransaction._id.toString() !== payment._id.toString()) {
                throw new apiError(400, "Transaction ID already used");
            }
        }

        // Fetch Order
        const order = await Order.findById(
            payment.order
        ).session(session);

        if (!order) {
            throw new apiError(404, "Order not found");
        }

        // Order Checks
        if (order.orderStatus === "cancelled") {
            throw new apiError(400, "Order has been cancelled");
        }

        if (order.paymentStatus === "paid") {
            throw new apiError(400, "Order already paid");
        }

        // Amount Verification
        if (Math.abs(Number(gatewayAmount) - Number(order.totalAmount)) > 0.01) {
            throw new apiError(400, "Payment amount mismatch");
        }

        // Gateway Failed
        if (gatewayStatus === "failed") {

            payment.paymentStatus = "failed";
            await payment.save({ session });
            await session.commitTransaction();
            return res.status(400).json(
                new apiResponse(400, payment, "Payment failed"
                )
            );
        }

        // Mark Payment Paid
        payment.paymentStatus = "paid";
        payment.transactionId =
            transactionId || null;

        // Optional (recommended)
        payment.paidAt = new Date();

        await payment.save({ session });

        // Update Order
        order.paymentStatus = "paid";

        if (order.orderStatus === "pending") {
            order.orderStatus = "confirmed";
        }

        await order.save({ session });


        // Commit   
        await session.commitTransaction();

        return res.status(200)
            .json(new apiResponse(
                200, { payment, order }, "Payment verified successfully"
            ));
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        await session.endSession();
    }
});

const paymentWebhook = asyncHandler(async (req, res) => {

    const {
        transactionRef,
        transactionId,
        status,
        amount
    } = req.body;

    if (
        !transactionRef || !status || amount === undefined) {
        return res.status(400).json({
            success: false,
            message: "Invalid webhook payload"
        });
    }

    const session = await mongoose.startSession();

    try {

        await session.startTransaction();

        const payment = await Payment.findOne({
            gatewayReference: transactionRef
        }).session(session);

        if (!payment) {
            await session.commitTransaction();

            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // idempotency
        if (payment.paymentStatus === "paid") {

            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                message: "Payment already processed"
            });
        }

        if (["cancelled", "refunded"].includes(payment.paymentStatus)) {
            throw new apiError(400, `Payment is ${payment.paymentStatus}`);
        }

        const order = await Order.findById(
            payment.order
        ).session(session);

        if (!order) {
            throw new apiError(404, "Order not found");
        }
        if (order.orderStatus === "cancelled") {
            throw new apiError(400, "Order already cancelled");
        }

        if (Math.abs(Number(amount) - Number(payment.amount)) > 0.01) {
            throw new apiError(400, "Amount mismatch");
        }

        // Failed payment
        if (status !== "SUCCESS") {

            payment.paymentStatus = "failed";
            await payment.save({ session });
            await session.commitTransaction();
            return res.status(200).json({
                success: true,
                message: "Failure processed"
            });
        }

        // Duplicate transaction check
        if (transactionId) {

            const existingTransaction =
                await Payment.findOne({
                    transactionId
                }).session(session)

            if (existingTransaction &&
                existingTransaction._id.toString() !== payment._id.toString()) {

                throw new apiError(
                    400,
                    "Duplicate transaction id"
                )
            }
        }
        // Success payment
        payment.paymentStatus = "paid";
        payment.transactionId = transactionId;
        payment.paidAt = new Date();

        await payment.save({ session });



        order.paymentStatus = "paid";

        if (order.orderStatus === "pending") {
            order.orderStatus = "confirmed";
        }

        await order.save({ session });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Payment processed successfully"
        });

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;

    } finally {

        await session.endSession();

    }

});

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
    if (req.user.role !== "admin" && payment.user.toString() !==
        req.user._id.toString()) {
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



const getUserPayments = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const payments = await Payment.find({ user: userId })
        .populate("order")
        .sort({ createdAt: -1 })
        .lean()

    return res
        .status(200).json(new apiResponse(200, payments, 'payments fetched successfully'))
})


const getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new apiError(400, 'invalid payment id')
    }
    const payment = await Payment.findById(paymentId)
        .populate("order")
        .populate("user", "name email");

    if (!payment) {
        throw new apiError(404, 'payment not found')
    }
    // ownership check
    if (req.user.role !== "admin" && payment.user._id.toString() !== req.user._id.toString()) {
        throw new apiError(403, "Unauthorized access");
    };

    return res
        .status(200).json(new apiResponse(200, payment, 'payment successfully fetched by payment id '))
})



const updatePaymentStatus = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        throw new apiError(
            403,
            "Admin access required"
        );
    }
    const { paymentId } = req.params
    const { status } = req.body

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new apiError(400, 'invalid payment id')
    }

    const allowedStatus = [
        "pending",
        "processing",
        "paid",
        "failed",
        "refunded",
        "cancelled"
    ]
    if (!allowedStatus.includes(status)) {
        throw new apiError(400, 'invalid payment status')
    }

    const validTransitions = {
        pending: ["processing", "cancelled"],
        processing: ["paid", "failed", "cancelled"],
        paid: ["refunded"],
        failed: [],
        refunded: [],
        cancelled: []
    };

    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        const payment = await Payment.findById(paymentId).session(session)

        if (!payment) {
            throw new apiError(404, 'payment not found')
        }

        const allowedNextStates = validTransitions[payment.paymentStatus]
        if (!allowedNextStates.includes(status)) {
            throw new apiError(400, `Cannot move payment from ${payment.paymentStatus} to ${status}`)
        }

        payment.paymentStatus = status;

        if (status === 'paid') {
            payment.paidAt = new Date();
        }
        if (status === "refunded") {
            payment.refundedAt = new Date();
        }

        await payment.save({ session });

        const order = await Order.findById(
            payment.order
        ).session(session);

        if (status === "refunded" && order.orderStatus === "delivered") {
            throw new apiError(400, "Delivered order cannot be refunded");
        }

        if (order) {

            if (status === "paid") {
                order.paymentStatus = "paid";

                if (order.orderStatus === "pending") {
                    order.orderStatus = "confirmed";
                }
            }
            if (status === "refunded") {
                order.paymentStatus = "refunded";
            }

            if (status === "failed" || status === "cancelled") {
                order.paymentStatus = status;
            }

            await order.save({ session });
        }
        await session.commitTransaction();

        return res.status(200).json(
            new apiResponse(
                200,
                payment,
                "Payment status updated successfully"
            )
        );


    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;
    } finally {
        await session.endSession();
    }






})


const confirmCODPayment = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        throw new apiError(
            403,
            "Admin access required"
        );
    }
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new apiError(400, "Invalid order id");
    }

    const session = await mongoose.startSession();

    try {

        await session.startTransaction();

        const order = await Order.findById(
            orderId
        ).session(session);

        if (!order) {
            throw new apiError(404, "Order not found");
        }

        const payment = await Payment.findById(
            order.payment
        ).session(session);

        if (!payment) {
            throw new apiError(404, "Payment not found");
        }

        if (payment.paymentMethod !== "COD") {
            throw new apiError(400, "This is not a COD payment");
        }

        if (payment.paymentStatus === "paid") {
            throw new apiError(400, "COD payment already confirmed");
        }

        if (order.orderStatus !== "delivered") {
            throw new apiError(400, "Order must be delivered before confirming COD payment");
        }
        if (order.paymentStatus === "paid") {
            throw new apiError(400, 'Order Already Paid')
        }

        payment.paymentStatus = "paid";
        payment.paidAt = new Date();
        await payment.save({ session });

        order.paymentStatus = "paid";
        await order.save({ session });
        await session.commitTransaction();

        return res.status(200).json(
            new apiResponse(200, { payment, order }, "COD payment confirmed successfully"
            )
        );

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw error;
    } finally {
        await session.endSession();
    }

});


const refundPayment = asyncHandler(async (req, res) => {

    if (req.user.role !== "admin") {
        throw new apiError(403, "Admin access required");
    }

    const { refundReason } = req.body

    if (!refundReason?.trim()) {
        throw new apiError(400, "Refund reason is required");
    }

    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new apiError(400, "Invalid payment id");
    }

    const session = await mongoose.startSession();

    try {

        await session.startTransaction();

        const payment = await Payment.findById(
            paymentId
        ).session(session);

        if (!payment) {
            throw new apiError(404, "Payment not found");
        }

        // Only paid payments can be refunded
        if (payment.paymentStatus !== "paid") {
            throw new apiError(400, `Cannot refund a ${payment.paymentStatus} payment`
            );
        }

        const order = await Order.findById(
            payment.order
        ).session(session);

        if (!order) {

            throw new apiError(404, "Order not found");
        }
        if (order.orderStatus === "delivered") {
            throw new apiError(400, "Delivered order cannot be refunded");
        }

        // Update payment
        payment.paymentStatus = "refunded";

        payment.refundReason = refundReason

        payment.refundedAt = new Date();

        await payment.save({ session });

        // Update order
        order.paymentStatus = "refunded";

        if (order.orderStatus !== "delivered") {
            order.orderStatus = "cancelled";
        }

        await order.save({ session });

        await session.commitTransaction();

        return res.status(200).json(
            new apiResponse(
                200,
                {
                    payment,
                    order
                },
                "Payment refunded successfully"
            )
        );

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;

    } finally {

        await session.endSession();

    }

});


export {
    createPayment,
    verifyPayment,
    paymentWebhook,
    getPaymentByOrderId,
    getUserPayments,
    getPaymentById,
    updatePaymentStatus,
    confirmCODPayment,
    refundPayment
}