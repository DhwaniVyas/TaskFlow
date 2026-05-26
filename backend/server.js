const app = require("./src/app");
const connectDB = require("./src/config/db");
const { env } = require("./src/config/env");
const { checkUpcomingDeadlines } = require("./src/utils/notificationService");

async function startServer() {
  try {
    await connectDB();
    
    // Scan for deadlines immediately on startup
    checkUpcomingDeadlines();
    // Schedule scans every 30 minutes
    setInterval(checkUpcomingDeadlines, 30 * 60 * 1000);

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
