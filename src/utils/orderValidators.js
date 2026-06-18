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

const validateOrderOwnership = () => {

}

const validateOrderOwnership = () => {

}








export {
    validateShippingAddress,
    validateOrderEmptycart
};