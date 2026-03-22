const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error details — full stack in development, concise in production
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${statusCode}] ${message}`, err.stack);
  } else {
    console.error(`[${statusCode}] ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
module.exports = errorHandler;