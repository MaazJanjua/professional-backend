import apiError from "../utils/apiError.js";
import mongoose from "mongoose";


//validateObjectId
const validateObjectId = (
    id,
    fieldName = "ID"
) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new apiError(400, `Invalid ${fieldName}`);
    }
}; 



// validatePagination
const validatePagination = (page, limit) => {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    if (isNaN(pageNumber) || pageNumber < 1) {
        throw new apiError(400, "Invalid page number");
    }

    if (isNaN(limitNumber) || limitNumber < 1) {
        throw new apiError(400, "Invalid limit number");
    }
    return {
        pageNumber,
        limitNumber
    };
};


export {
    validateObjectId,
    validatePagination
}