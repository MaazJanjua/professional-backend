import apiError from "../utils/apiError.js";



const validateCreateProductData = ({
    title,
    description,
    price,
    category,
    stock
}) => {
    if (!title?.trim() || !description?.trim() ||
        !category?.trim() || price == null || stock == null) {
        throw new apiError(400, "All fields (title, description, price, category, stock) are required");
    }

    if (price < 0 || stock < 0) {
        throw new apiError(400, "Price and stock cannot be negative");
    }
};


const validateProductExists = (product) => {
    if (!product) {
        throw new apiError(404, 'product not found ')
    }
}

export {
    validateProductExists,
    validateCreateProductData
}