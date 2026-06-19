import apiError from "../utils/apiError.js";


const validateCartExists = (cart) => {
    if (!cart) {
        throw new apiError(404, 'cart not found');
    }
}
const validateItemExists = (item) => {
    if (!item) {
        throw new apiError(404, 'item not found in cart');
    }
}


export {
    validateCartExists,
    validateItemExists
}