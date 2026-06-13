import rateLimit from "express-rate-limit";



// View limiter
const viewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
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

export {
    viewLimiter,
    loginLimiter,
    commentLimiter
};