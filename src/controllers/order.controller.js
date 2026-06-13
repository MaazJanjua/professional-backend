import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js'



const createOrder = asyncHandler(async (req, res) => {
    // 👉 Cart se order banata hai
    // 👉 product snapshot save karta hai
    // 👉 totalAmount calculate karta hai
    // 👉 cart clear karta hai
})
const getUserOrders = asyncHandler(async (req, res) => {
    // 👉 current user ke sab orders fetch
    // 👉 “My Orders” page
})
const getOrderById = asyncHandler(async (req, res) => {
    //     👉 order detail page
    // 👉 tracking + items show
})
const cancelOrder = asyncHandler(async (req, res) => {

    //     👉 sirf pending / confirmed orders cancel
    // 👉 stock restore logic
})
const updateOrderStatus = asyncHandler(async (req, res) => {
    //👉 pending → confirmed → shipped → delivered
}) 
const updatePaymentStatus = asyncHandler(async (req, res) => {
    //     👉 payment success/fail update
    // 👉 payment gateway integration
})
const getAllOrders = asyncHandler(async (req, res) => {
    //👉 admin dashboard
    // 👉 filter by status, date, user
})
const deleteOrder = asyncHandler(async (req, res) => { })

 

export {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    updatePaymentStatus,
    getAllOrders,
    deleteOrder 
}

// 8 controllers functions for order management