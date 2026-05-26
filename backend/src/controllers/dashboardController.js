const Task = require("../models/Task");
const Project = require("../models/Project");
const ActivityLog = require("../models/ActivityLog");

async function getDashboard(req, res, next) {
  try {
    const now = new Date();
    const taskAccessQuery = {
      $or: [
        { creator: req.user._id, projectId: null },
        { user: req.user._id, projectId: null },
        { assignedTo: req.user._id },
      ],
    };
    const totalTasks = await Task.countDocuments(taskAccessQuery);
    const completed = await Task.countDocuments({ ...taskAccessQuery, status: "completed" });
    const pending = await Task.countDocuments({ ...taskAccessQuery, status: { $ne: "completed" } });
    const overdue = await Task.countDocuments({
      ...taskAccessQuery,
      dueDate: { $lt: now },
      status: { $ne: "completed" },
    });
    const highPriority = await Task.countDocuments({
      ...taskAccessQuery,
      priority: "high",
      status: { $ne: "completed" },
    });
    const [upcomingDeadlines, recentActivities, projectCount] = await Promise.all([
      Task.find({ ...taskAccessQuery, dueDate: { $ne: null }, status: { $ne: "completed" } })
        .sort({ dueDate: 1 })
        .limit(5)
        .select("title dueDate priority status projectId"),
      ActivityLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).select("action createdAt"),
      Project.countDocuments({
        $or: [{ owner: req.user._id }, { members: { $elemMatch: { user: req.user._id, status: "accepted" } } }],
      }),
    ]);
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
          notificationPreferences: req.user.notificationPreferences,
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
          activeProjects: projectCount,
          productivityScore: completionRate,
        },
        upcomingDeadlines,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
