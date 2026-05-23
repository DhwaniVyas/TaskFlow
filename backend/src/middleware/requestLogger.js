function requestLogger(req, res, next) {
  const start = Date.now();
  const origin = req.headers.origin || "no-origin";

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms origin=${origin}`;
    if (res.statusCode >= 400) {
      console.error(`[HTTP] ${line}`);
    } else {
      console.log(`[HTTP] ${line}`);
    }
  });

  next();
}

module.exports = requestLogger;
