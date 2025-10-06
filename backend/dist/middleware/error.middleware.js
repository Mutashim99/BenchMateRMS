export const errorHandler = (err, req, res, next) => {
    console.log("Error Handler:", err);
    const { status, message } = err;
    res.status(status || 500).json({
        success: false,
        message: message || "Something went wrong"
    });
};
