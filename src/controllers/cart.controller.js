import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import Cart from "../models/cart.models.js";




const addToCart = asyncHandler(async (req, res) => {

    // Product ID URL params se le rahe hain
    const { productId } = req.params;

    // Logged-in user ki ID
    const userId = req.user._id;

    // Pehle check karo:
    // Agar user ke cart mein ye product already exist karta hai
    // to uski quantity increase kar do
    const cart = await Cart.findOneAndUpdate(
        {
            owner: userId,

            // Cart ke items array mein product search karna
            "items.product": productId
        },
        {
            // Matched product ki quantity +1 karna
            $inc: {
                "items.$.quantity": 1
            }
        },
        {
            // Updated cart return karega
            new: true
        }
    );

    // Agar product cart mein pehle se exist karta tha
    // to yahan se response return ho jayega
    if (cart) {

        return res.json(
            new apiResponse(
                200,
                cart,
                "quantity increased"
            )
        )
    }

    // Agar product cart mein exist nahi karta
    // to new item cart ke items array mein add karo
    const newCart = await Cart.findOneAndUpdate(
        {
            // User ka cart find karna
            owner: userId
        },
        {
            // Items array mein new product push karna
            $push: {
                items: {
                    product: productId,
                    quantity: 1,
                    addedAt: new Date()
                }
            }
        },
        {
            // Updated cart return karega
            new: true,

            // Agar cart nahi mila to naya cart create kar dega
            upsert: true
        }
    );

    // New product add hone ke baad response
    return res.json(
        new apiResponse(
            200,
            newCart,
            "product added"
        )
    )


})

const getCart = asyncHandler((req, res) => {
    //     👉 User ka current cart fetch karega
    // 👉 products populate ke sath 
    const userId = req.user._id

    const cart = await Cart.findOne({
        owner: userId
    }).populate('owner', 'items.product')

    if (!cart) {
        throw new apiError(404, 'cart not found')
    }

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                cart,
                "Cart fetched successfully"
            )
        );
})

const removeFromCart = asyncHandler(async (req, res) => {
    // 👉 specific product cart se remove
    const { productId } = req.params
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new apiError(400, 'invalid productId')
    }
    const cart = await Cart.findOneAndUpdate(
        {
            owner: req.user._id
        },
        {
            $pull: {
                items: {
                    product: productId
                }
            }
        },
        {
            new: true
        }
    )
    if (!cart) {
        throw new apiError(404, 'cart not found')
    }
    return res
        .status(200)
        .json(
            new apiResponse(200, cart, 'item deleted successfully from cart')
        )
})

const updateCartItemQuantity = asyncHandler((req, res) => {
    // 👉 product quantity change (increase / decrease)


    // product quantity change (increase / decrease)

    const { productId } = req.params;

    const { action } = req.body;
    // action: "increase" ya "decrease"


    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new apiError(400, 'productId invalid')
    }

    if (!["icrease", "decrease"].includes(action)) {
        throw new apiError(400, 'invalid action')
    }

    const quantityChange = action === 'increase' ? 1 : -1;

    findOneAndUpdate(
        {
            owner: req.user._id,
            "items.product": productId
        },
        {
            $inc: {
                "items.$.quantity": quantityChange
            }
        },
        { new: true }
    )

    if (!cart) {
        throw new apiError(404, "product not found in cart");
    }


    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                cart,
                "cart quantity updated"
            )
        );

})

const clearCart = asyncHandler((req, res) => {
    // poora cart empty
    const { userId } = req.user._id;
    const cart = await Cart.findOneAndUpdate(
        {
            owner: userId
        },
        {
            $set: {
                //Empty items array
                items: []
            }
        },
        {
            new: true
        }
    )
    if (!cart) {
        throw new apiError(404, 'cart not found')
    }
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                cart,
                "cart cleared successfully"
            )
        );
})

const syncCart = asyncHandler(async (req, res) => {

    // 👉 Sync guest cart with DB cart using atomic bulk operations
    const { items } = req.body

    const bulkOps = items.map((item) => {
        return {
            updateOne: {
                filter: {
                    owner: req.user._id,
                    "items.product": item.productId
                },
                update: {
                    $inc: { "items.$.quantity": item.quantity }
                }
            }
        }
    });
    //🔥 Step 1: Increase quantity where product already exists

    await Cart.bulkWrite(bulkOps)

    // 🔥 Step 2: Add missing products (not already in cart)

    await Cart.updateOne(
        { owner: req.user._id },
        {
            $addToSet: {
                items: {
                    $each: items.map((i) => {
                        return {
                            product: i.productId,
                            quantity: i.quantity
                        }
                    })
                }
            }
        },

    )
    const updateCart = await Cart.findOne({ owner: req.user._id })

    return res.json(
        new apiResponse(200, updatedCart, "cart synced using bulkWrite")
    );

})

export {

    addToCart,
    getCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    syncCart
}

// 🧠 Simple flow  rakh:
// add → cart mein daalna
// get → cart dekhna
// update → quantity change
// remove → item delete
// clear → full reset

// 6 controllers functions for cart management