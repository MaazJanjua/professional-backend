import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from "../utils/apiError.js";
import Cart from "../models/cart.models.js";
import Product from "../models/product.models.js";
import Order from "../models/order.models.js";
import apiResponse from "../utils/apiResponse.js";
import Payment from "../models/payment.models.js";

//validators IMPORTS
import {
    validateShippingAddress,
    validateOrdersNotFound,
    validateOrderEmptycart,
    validateOrderExists
} from '../utils/orderValidators.js'

import {
    validateObjectId,
    validatePagination
} from '../utils/globalValidators.js'

import { validateProductExists } from '../utils/productValidator.js'


const createOrder = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { shippingAddress } = req.body;

    validateShippingAddress(shippingAddress)

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Find user cart
        const cart = await Cart.findOne({ owner: userId }).session(session);

        validateOrderEmptycart(cart)

        // Get products from DB
        const products = await Product.find({
            _id: {
                $in: cart.items.map(item => item.product)
            }
        }).session(session);

        let orderItems = [];
        let totalAmount = 0;

        // Check stock + prepare order items
        for (const cartItem of cart.items) {

            //Product find karna
            const product = products.find(
                p =>
                    p._id.toString() === cartItem.product.toString()
            );

            //Product exist check
            validateProductExists(product)

            //Stock check
            if (product.stock < cartItem.quantity) {
                throw new apiError(400, `${product.title} stock not available`);
            }

            // order snapshot
            orderItems.push({
                product: product._id,
                title: product.title,
                image: product.images?.[0]?.url || "",
                quantity: cartItem.quantity,
                price: product.discountPrice || product.price

            });

            // Total calculate
            // totalAmount += price * quantity
            totalAmount +=
                (product.discountPrice ?? product.price)
                * cartItem.quantity;

            // 4. decrease stock
            await Product.findByIdAndUpdate(
                product._id,
                {
                    // MONGO OPERATION increase/decrease ke liye.
                    $inc: {
                        stock: -cartItem.quantity
                    }
                },
                {
                    session
                }
            );

        }

        const orderNumber = `ORD-${Date.now()}`;
        //Create order

        const order = await Order.create([
            {
                orderNumber,
                user: userId,
                items: orderItems,
                totalAmount,
                shippingAddress
            }], { session }
        );

        // Empty cart
        await Cart.findOneAndUpdate({
            owner: userId
        }, {
            $set: {
                items: []
            }
        }, {
            session
        });

        // transaction complete/Transaction save
        //Ab Mongo bolta hai:
        // "Okay final changes save karo"

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: order[0]
        });

    } catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});

// const getUserOrders = asyncHandler(async (req, res) => {
  
//     const activeOrders = await Order.find({
//         user: req.user._id,
//         orderStatus: {
//             $nin: ["cancelled", "delivered"]
//         }
//     }).populate("user", "username fullName email")
//         .populate("items.product", "title price images")
//         .sort({
//             createdAt: -1
//         })


//     validateOrdersNotFound(activeOrders)
//     const cancelledOrders = await Order.find({
//         user: req.user._id,
//         orderStatus: "cancelled"
//     }).populate("user", "username fullName email")
//         .populate("items.product", "title price images");


//     const orderHistory = await Order.find({
//         user: req.user._id,
//         orderStatus: {
//             $in: ["delivered", "cancelled"]
//         }
//     }).populate("user", "username fullName email")
//         .populate("items.product", "title price images");


//     return res.status(200).json(new apiResponse(200, {
//         cancelledOrders,
//         activeOrders,
//         orderHistory
//     }, 'orders fetched successfully'))
// })

const getUserOrders1 = asyncHandler(async (req, res) => {
    // Active Orders
    const activeOrders = await Order.find({
        user: req.user._id,
        orderStatus: {
            $in: ["pending", "confirmed", "shipped"]
        }
    }).populate("user", "username fullName email")
        .populate("items.product", "title price images")
        .sort({ createdAt: -1 });

    // Order History
    const orderHistory = await Order.find({
        user: req.user._id,
        orderStatus: {
            $in: ["delivered", "cancelled"]
        }
    }).populate("user", "username fullName email")
        .populate("items.product", "title price images")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new apiResponse(
            200,
            {
                activeOrders,
                orderHistory,
                summary: {
                    activeOrdersCount: activeOrders.length,
                    historyCount: orderHistory.length
                }
            },
            "Orders fetched successfully"
        )
    );
});

const getOrderById = asyncHandler(async (req, res) => {
    //  order detail page
    // tracking + items show
    const { orderId } = req.params

    validateObjectId(orderId, "order id")

    // ownership + fetch order
    const findUser = await Order.findOne({
        _id: orderId,
        user: req.user._id
    }).populate("items.product", "title images price")
        .populate("user", "name email");

    const order = await Order.findById(orderId)

    validateOrderExists(order)

    return res
        .status(200)
        .json(new apiResponse(200, order, 'order fetched by id successfully'))
})


const cancelOrder = asyncHandler(async (req, res) => {
    //  sirf pending / confirmed orders cancel
    //  stock restore logic
    const { orderId } = req.params

    validateObjectId(orderId, "order id")

    const order = await Order.findById(orderId)

    validateOrderExists(order)

    //  ownership check
    if (order.user.toString() !== req.user._id.toString()) {
        throw new apiError(403, "Not allowed to cancel this order");
    }

    // 2. Sirf pending / confirmed orders cancel ho sakte hain
    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
        throw new apiError(400, 'Order cannot be cancelled after shipping/delivery')
    }

    if (order.orderStatus === "cancelled") {
        return res.status(400).json({
            success: false,
            message: "Order already cancelled"
        });
    }

    //  restore stock (optimized)
    await Promise.all(
        order.items.map(item =>
            Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            })
        )
    );

    Product.stock

    // 4. Order status update
    order.orderStatus = "cancelled";
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully & stock restored",
        data: order
    });

})

const updateOrderStatus = asyncHandler(async (req, res, next) => {
    //pending → confirmed → shipped → delivered

    const { orderId } = req.params
    const { status } = req.body
    validateObjectId(orderId, "order id")

    const order = await Order.findById(orderId)

    validateOrderExists(order)
    const allowedStatus = [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled"
    ]

    if (!allowedStatus.includes(status)) {
        throw new apiError(400, 'invalid order status')
    }

    if (order.orderStatus === "delivered" || order.orderStatus === "cancelled") {
        throw new apiError(400, "order already delivered or cancelled")
    }

    // status flow
    const nextStatus = {
        pending: "confirmed",
        confirmed: "shipped",
        shipped: "delivered"
    }

    const expectedStatus = nextStatus[order.orderStatus]

    //check transition
    if (expectedStatus !== status) {
        throw new apiError(
            400,
            `you can only move order from ${order.orderStatus} to ${expectedStatus}`
        )
    }
    if (status === 'shipped' && !req.body.trackingNumber) {
        throw new apiError(
            400,
            "tracking number required for shipped order"
        )
    }

    // update
    order.orderStatus = status

    if (status === "shipped") {
        order.trackingNumber = req.body.trackingNumber
    }

    await order.save()

    return res
        .status(200)
        .json(new apiResponse(200, status, 'order status updated succesfully'))
})

const updatePaymentStatus = asyncHandler(async (req, res) => {
    //  payment success/fail update
    //  payment gateway integration

    const { paymentId } = req.params;
    const { paymentStatus, transactionId } = req.body;

    validateObjectId(paymentId, "payment id");

    const allowedStatuses = [
        "pending",
        "paid",
        "failed",
        "refunded"
    ];

    if (!allowedStatuses.includes(paymentStatus)) {
        throw new apiError(400, "Invalid payment status");
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const payment = await Payment.findById(paymentId)
            .session(session);

        validatePaymentExists(payment)

        // already finalized
        if (
            payment.paymentStatus === "paid" &&
            paymentStatus === "paid"
        ) {
            throw new apiError(400, "Payment already marked as paid");
        }

        payment.paymentStatus = paymentStatus;

        if (transactionId) {
            payment.transactionId = transactionId;
        }

        if (paymentStatus === "paid") {
            payment.paidAt = new Date();
        }

        if (paymentStatus === "failed") {
            payment.failedAt = new Date();
        }

        await payment.save({ session });

        // sync order payment status
        const order = await Order.findById(payment.order)
            .session(session);

        validateOrderExists(order);

        order.paymentStatus = paymentStatus;

        await order.save({ session });

        await session.commitTransaction();

        return res.status(200).json(
            new apiResponse(
                200, {
                payment,
                order
            }, "Payment status updated successfully")
        );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
})


const getAllOrders = asyncHandler(async (req, res) => {
    // admin dashboard
    // filter by status, date, user
    const {
        status,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 10
    } = req.query

    const { pageNumber, limitNumber } = validatePagination(page, limit)

    // allowed status
    const allowedStatus = [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled"
    ]

    if (status && !allowedStatus.includes(status)) {
        throw new apiError(400, "invalid status")
    }

    validateObjectId(userId, 'user id')

    // better date validation
    let start, end

    if (startDate) {
        start = new Date(startDate)
        if (isNaN(start.getTime())) {
            throw new apiError(400, "invalid start date")
        }
    }

    if (endDate) {
        end = new Date(endDate)
        if (isNaN(end.getTime())) {
            throw new apiError(400, "invalid end date")
        }
    }


    let filter = {}

    if (status) filter.orderStatus = status
    if (userId) filter.user = userId

    if (start && end) {
        filter.createdAt = {
            $gte: start,
            $lte: end
        }
    }

    const orders = await Order.find(filter)
        .populate("user", 'name email')
        .sort({ createdAt: -1 })
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)

    const totalOrders = await Order.countDocuments(filter)

    return res.status(200).json(
        new apiResponse(
            200,
            {
                orders,
                totalOrders,
                page: pageNumber,
                totalPages: Math.ceil(totalOrders / limitNumber)
            },
            "orders fetched successfully"
        )
    )
})

const getAllMyOrders = asyncHandler(async (req, res) => {

    const userId = req.user._id

    const { page = 1, limit = 10 } = req.query

    const { pageNumber, limitNumber } = validatePagination(page, limit)

    const orders = await Order.find({ user: userId })
        .select(
            "orderNumber items totalAmount orderStatus paymentStatus trackingNumber createdAt"
        ).populate("items.product", "title price images")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)

    const totalOrders = await Order.countDocuments({ user: userId })

    return res.status(200).json(
        new apiResponse(
            200,
            {
                orders,
                totalOrders,
                page: pageNumber,
                totalPages: Math.ceil(totalOrders / limitNumber)
            },
            "orders fetched successfully"
        )
    )
})

const deleteOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params
    validateObjectId(orderId, 'order id')

    const order = await Order.findOne({
        _id: orderId,
        user: req.user._id
    })

    validateOrderExists(order)

    // 3. business rule: only allow delete if pending or cancelled
    if (order.orderStatus !== "pending" && order.orderStatus !== "cancelled") {
        throw new apiError(
            400,
            "order cannot be deleted after processing has started")
    }

    //delete order
    await Order.deleteOne({
        _id: orderId
    })

    return res.status(200).json(
        new apiResponse(
            200,
            null,
            "order deleted successfully"
        )
    )
})

export {
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
}