import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import Cart from "../models/cart.models.js";

//VALODATORS IMPORTS
import {
    validateObjectId
} from '../utils/globalValidators.js'
import {
    validateCartExists,
    validateItemExists
} from '../utils/cartValidators.js'



const addToCart = asyncHandler(async (req, res) => {

    // Product ID URL params se le rahe hain
    const { productId } = req.params;
    validateObjectId(productId, "product id")

    // Logged-in user ki ID
    const userId = req.user._id;

    // Pehle check karo:
    // Agar user ke cart mein ye product already exist karta hai
    // to uski quantity increase kar do
    const cart = await Cart.findOneAndUpdate({
        owner: userId,
        // Cart ke items array mein product search karna
        "items.product": productId
    }, {
        // Matched product ki quantity +1 karna
        $inc: {
            "items.$.quantity": 1
        }
    }, {
        // Updated cart return karega
        new: true
    });

    // Agar product cart mein pehle se exist karta tha
    // to yahan se response return ho jayega
    if (cart) {
        return res.json(
            new apiResponse(200, cart, "quantity increased")
        )
    }

    // Agar product cart mein exist nahi karta
    // to new item cart ke items array mein add karo
    const newCart = await Cart.findOneAndUpdate({
        // User ka cart find karna
        owner: userId
    }, {
        // Items array mein new product push karna
        $push: {
            items: {
                product: productId,
                quantity: 1,
                addedAt: new Date()
            }
        }
    }, {
        // Updated cart return karega
        new: true,
        // Agar cart nahi mila to naya cart create kar dega
        upsert: true
    });

    // New product add hone ke baad response
    return res.json(
        new apiResponse(
            200,
            newCart,
            "product added"
        )
    )
})

const getCart = asyncHandler(async (req, res) => {
    // User ka current cart fetch karega
    // products populate ke sath 
    const userId = req.user._id

    const cart = await Cart.findOne({
        owner: userId
    }).populate('owner', 'items.product')

    validateCartExists(cart)

    return res.status(200).json(
        new apiResponse(200, cart, "Cart fetched successfully")
    );
})


const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    validateObjectId(productId, "product id")

    const cart = await Cart.findOne({ owner: req.user._id });

    validateCartExists(cart)

    const item = cart.items.find(
        i => i.product.toString() === productId
    );

    validateItemExists(item)

    let message;

    if (item.quantity > 1) {
        item.quantity -= 1;
        message = "1 item removed from cart";
    } else {
        cart.items = cart.items.filter(
            i => i.product.toString() !== productId
        );
        message = "All items removed  from cart";
    }

    await cart.save();

    return res.status(200).json(
        new apiResponse(200, cart, message)
    );
});

const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { action } = req.body;

    validateObjectId(productId, "product id")

    if (!["increase", "decrease"].includes(action)) {
        throw new apiError(400, 'invalid action')
    }

    const cart = await Cart.findOne({
        owner: req.user._id
    });

    validateCartExists(cart)

    const item = cart.items.find(
        item => item.product.toString() === productId
    );

    validateItemExists(item)

    // decrease and quantity is 1
    if (item.quantity === 1 && action === "decrease") {
        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );
    }
    // normal increase/decrease
    else {
        if (action === "increase") {
            item.quantity += 1;
        }
        if (action === "decrease") {
            item.quantity -= 1;
        }
    }

    await cart.save();

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                cart,
                "cart quantity updated"
            )
        );

});

const clearCart = asyncHandler(async (req, res) => {
    // poora cart empty
    const userId = req.user._id;
    const cart = await Cart.findOneAndUpdate({
        owner: userId
    }, {
        $set: {
            //Empty items array
            items: []
        }
    }, {
        new: true
    })
    validateCartExists(cart)
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

    const { items } = req.body;

    const bulkOps = items.map((item) => ({
        updateOne: {
            filter: {
                owner: req.user._id,
                "items.product": item.productId
            },
            update: {
                $inc: {
                    "items.$.quantity": item.quantity
                }
            }
        }
    }));

    await Cart.bulkWrite(bulkOps);

    await Cart.updateOne(
        {
            owner: req.user._id
        },
        {
            $addToSet: {
                items: {
                    $each: items.map((i) => ({
                        product: i.productId,
                        quantity: i.quantity
                    }))
                }
            }
        }
    );


    const updatedCart = await Cart.findOne({
        owner: req.user._id
    });

    // total quantity calculate
    const totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    updatedCart.totalItems = totalItems;

    await updatedCart.save();

    return res.json(
        new apiResponse(
            200,
            updatedCart, totalItems &&
        "cart synced using bulkWrite"
        )
    );

});

export {

    addToCart,
    getCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    syncCart
}

// Simple flow  rakh:
// add → cart mein daalna
// get → cart dekhna
// update → quantity change
// remove → item delete
// clear → full reset