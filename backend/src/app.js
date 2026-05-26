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
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  searchTasks,
  filterTasks,
  sortTasks,
  updateTaskStatus,
  toggleSubtask,
} = require("./controllers/taskController");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  deleteProject,
  linkTaskToProject,
  inviteProjectMember,
  acceptProjectInvite,
  getProjectComments,
} = require("./controllers/projectController");
const { getAnalytics } = require("./controllers/analyticsController");
const { assignTask, addComment, getTaskComments } = require("./controllers/teamController");
const { getNotifications } = require("./controllers/notificationController");

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

// Tasks
app.post("/api/tasks", protect, createTask);
app.get("/api/tasks", protect, getTasks);
app.get("/api/tasks/search", protect, searchTasks);
app.get("/api/tasks/filter", protect, filterTasks);
app.get("/api/tasks/sort", protect, sortTasks);
app.get("/api/tasks/:id", protect, getTaskById);
app.put("/api/tasks/:id", protect, updateTask);
app.delete("/api/tasks/:id", protect, deleteTask);
app.patch("/api/tasks/:id/status", protect, updateTaskStatus);
app.patch("/api/tasks/:id/subtasks", protect, toggleSubtask);
app.patch("/api/tasks/:taskId/assign", protect, assignTask);
app.post("/api/tasks/:taskId/comments", protect, addComment);
app.get("/api/tasks/:taskId/comments", protect, getTaskComments);

// Projects
app.post("/api/projects", protect, createProject);
app.get("/api/projects", protect, getProjects);
app.get("/api/projects/:id", protect, getProjectById);
app.put("/api/projects/:id", protect, updateProject);
app.patch("/api/projects/:id/archive", protect, archiveProject);
app.delete("/api/projects/:id", protect, deleteProject);
app.patch("/api/projects/:id/link-task", protect, linkTaskToProject);
app.post("/api/projects/invite", protect, inviteProjectMember);
app.post("/api/projects/accept-invite", protect, acceptProjectInvite);
app.get("/api/projects/:id/comments", protect, getProjectComments);

// Analytics
app.get("/api/analytics", protect, getAnalytics);

// Notifications History
app.get("/api/notifications", protect, getNotifications);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

app.use(notFound);
app.use(errorHandler);

module.exports = app;
