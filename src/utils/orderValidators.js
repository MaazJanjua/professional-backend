import apiError from "../utils/apiError.js";

const validateShippingAddress = (shippingAddress) => {

    if (
        !shippingAddress ||
        !shippingAddress.name ||
        !shippingAddress.phoneNumber ||
        !shippingAddress.city ||
        !shippingAddress.address ||
        !shippingAddress.email
    ) {
        throw new apiError(
            400,
            "Shipping address required"
        );
    }
};

const validateOrderEmptycart = (cartEmpty) => {
    if (!cart || cart.items.length === 0) {
        throw new apiError(400, "Cart is empty");
    }

}

const validateOrdersNotFound = (NotFoundOrders) => {
    if (!activeOrders || activeOrders.length === 0) {
        throw new apiError(404, 'orders not found')
    }
}

const validateOrderExists = (order) => {
    if (!order) {
        throw new apiError(404, 'order not found')
    }
}

export {
    validateShippingAddress,
    validateOrderEmptycart,
    validateOrdersNotFound,
    validateOrderExists
};