import rateLimit from "express-rate-limit";

// View limiter
const viewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: "Too many view requests, try again later"
});

// Login limiter
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many login attempts"
});
// Comment limiter
const commentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many comments"
});

//cartLimiter
const cartLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: "Too many cart requests"
});

//orderLimiter
const orderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many order attempts"
});

//paymentLimiter
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many payment attempts"
});

//paymentVerifyLimiter
const paymentVerifyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many verification attempts"
});

//adminActionLimiter
const adminActionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many admin actions"
});

//order ActionLimiter
export const orderActionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: "Too many order actions"
});

//financialActionLimiter
const financialActionLimiter = rateLimit({
    windowMs: 60 * 1000,//1 minute
    max: 10,
    message: "To Many Financial Actions"
})

export {
    viewLimiter,
    loginLimiter,
    commentLimiter,
    cartLimiter,
    orderLimiter,
    paymentLimiter,
    paymentVerifyLimiter,
    adminActionLimiter,
    orderActionLimiter,
    financialActionLimiter
};