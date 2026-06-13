import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'

const addToCart = asyncHandler(async (req, res) => {
    //   Product cart mein add karega
    // 👉 Agar already exist kare → quantity increase  

})
const getCart = asyncHandler((req, res) => {
    //     👉 User ka current cart fetch karega
    // 👉 products populate ke sath
})
const removeFromCart = asyncHandler((req, res) => {
    // 👉 specific product cart se remove
})
const updateCartItemQuantity = asyncHandler((req, res) => {
    // 👉 product quantity change (increase / decrease)
}) 
const clearCart = asyncHandler((req, res) => {
    // poora cart empty
})
const syncCart = asyncHandler((req, res) => {
    // 👉 frontend cart + DB cart merge (login ke baad use hota hai)
})



// 🧠 Simple flow  rakh:
// add → cart mein daalna
// get → cart dekhna
// update → quantity change
// remove → item delete
// clear → full reset