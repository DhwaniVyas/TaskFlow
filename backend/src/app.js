const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");

const healthRoutes = require("./routes/health.routes");

const {
  register,
  verifyEmail,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout,
} = require("./controllers/authController");

const { getDashboard } = require("./controllers/dashboardController");

const { protect } = require("./middleware/authMiddleware");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

/*
|--------------------------------------------------------------------------
| Allowed Frontend Origins
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  "http://localhost:5173",
  ...(env.CLIENT_URLS || []),
];

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman / server requests
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all Vercel preview domains
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running",
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/health", healthRoutes);

// Auth
app.post("/api/auth/register", register);
app.get("/api/auth/verify-email", verifyEmail);

app.post("/api/auth/login", login);
app.post("/api/auth/google", googleAuth);

app.post("/api/auth/forgot-password", forgotPassword);

app.post("/api/auth/reset-password", resetPassword);

app.post("/api/auth/logout", protect, logout);

app.get("/api/auth/me", protect, getMe);

app.put("/api/auth/me", protect, updateProfile);

// Dashboard
app.get("/api/dashboard", protect, getDashboard);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFound);
app.use(errorHandler);

module.exports = app;
