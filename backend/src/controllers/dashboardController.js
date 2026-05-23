const Task = require("../models/Task");

async function getDashboard(req, res, next) {
  try {
    const now = new Date();
    const totalTasks = await Task.countDocuments({ user: req.user._id });
    const completed = await Task.countDocuments({ user: req.user._id, status: "completed" });
    const pending = await Task.countDocuments({ user: req.user._id, status: { $ne: "completed" } });
    const overdue = await Task.countDocuments({
      user: req.user._id,
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    });
    const highPriority = await Task.countDocuments({
      user: req.user._id,
      priority: "high",
      status: { $ne: "completed" },
    });
    const completionRate = totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);

    res.status(200).json({
      success: true,
      message: "Dashboard loaded",
      data: {
        user: {
          id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
          provider: req.user.provider,
          avatar: req.user.avatar,
          bio: req.user.bio,
          timezone: req.user.timezone,
          themePreference: req.user.themePreference,
          emailVerified: req.user.emailVerified,
          createdAt: req.user.createdAt,
          lastLoginAt: req.user.lastLoginAt,
        },
        overview: {
          totalTasks,
          completedTasks: completed,
          pendingTasks: pending,
          overdueTasks: overdue,
          highPriorityTasks: highPriority,
          completionRate,
          activeProjects: 0,
          productivityScore: completionRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
