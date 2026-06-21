import apiError from '../utils/apiError.js'

const categoryExists = (category) => {
    if (!category) {
        throw new apiError(404, "Category not found");
    }
}

export {
    categoryExists
}

