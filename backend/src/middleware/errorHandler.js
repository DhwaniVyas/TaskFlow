function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const origin = req.headers.origin || "no-origin";
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ${statusCode} origin=${origin} message="${err.message}"`);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
}

module.exports = errorHandler;
