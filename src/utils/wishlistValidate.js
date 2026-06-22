import apiError from "../utils/apiError.js";

const validateWishlistExists = (wishlist) => {
    if (!wishlist) {
        throw new apiError(404, 'wishlist not found')
    }
}
export {
    validateWishlistExists
}