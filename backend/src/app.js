const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const healthRoutes = require("./routes/health.routes");
const {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout,
} = require("./controllers/authController");
const { getDashboard } = require("./controllers/dashboardController");
const { protect } = require("./middleware/authMiddleware");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running",
  });
});

app.use("/api/health", healthRoutes);
app.post("/api/auth/register", register);
app.get("/api/auth/verify-email", verifyEmail);
app.post("/api/auth/login", login);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);
app.post("/api/auth/logout", protect, logout);
app.get("/api/auth/me", protect, getMe);
app.put("/api/auth/me", protect, updateProfile);
app.get("/api/dashboard", protect, getDashboard);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
