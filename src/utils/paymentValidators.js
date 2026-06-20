import apiError from '../utils/apiError.js';


const validatePaymentExists = (payment) => {
    if (!payment) {
        throw new apiError(404, "Payment not found");
    }
}

const validatePaymentmethod = (paymentMethod) => {
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
}

const validategatewayStatus = (status) => {
    const allowedGatewayStatuses = [
        "success",
        "failed"
    ];

    if (!allowedGatewayStatuses.includes(status)) {
        throw new apiError(400, "Invalid gateway status"
        );
    }
}

const validateGatewayAmount = (status) => {
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
}

const validateOrderAmount = (totalAmount) => {
    if (
        typeof totalAmount !== "number" ||
        totalAmount <= 0
    ) {
        throw new apiError(
            400,
            "Invalid order amount"
        );
    }
}


const validateOrderForPayment = (order) => {
    if (order.orderStatus === "cancelled") {
        throw new apiError(400, "Cannot create payment for a cancelled order");
    }

    if (order.orderStatus === "delivered") {
        throw new apiError(400, "Order already delivered");
    }

    if (order.paymentStatus === "paid") {
        throw new apiError(400, "Order is already paid");
    }
}


export {
    validatePaymentExists,
    validatePaymentmethod,
    validategatewayStatus,
    validateGatewayAmount,
    validateOrderAmount,
    validateOrderForPayment
}