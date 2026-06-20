const verifyAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        throw new apiError(403, "Admin access required");
    }
    next();
};