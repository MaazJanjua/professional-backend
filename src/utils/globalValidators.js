import apiError from "../utils/apiError.js";



//PRODUCT NOT FOUND / Product exist check

const validateProductNotFound = (NotFoundProduct) => {
    if (!product) {
        throw new apiError(404, 'product not found ')
    }
}


// productId check





export {
    validateProductNotFound
}