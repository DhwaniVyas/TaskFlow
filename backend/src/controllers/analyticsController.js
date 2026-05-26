const Task = require("../models/Task");
const Project = require("../models/Project");

function rangeToDates(range) {
  const now = new Date();
  const start = new Date(now);
  if (range === "week") start.setDate(now.getDate() - 7);
  else if (range === "month") start.setMonth(now.getMonth() - 1);
  else if (range === "quarter") start.setMonth(now.getMonth() - 3);
  else if (range === "year") start.setFullYear(now.getFullYear() - 1);
  return { start, end: now };
}

async function getAnalytics(req, res, next) {
  try {
    const range = req.query.range || "month";
    const { start, end } = rangeToDates(range);

    const taskAccessQuery = {
      $or: [
        { creator: req.user._id, projectId: null },
        { user: req.user._id, projectId: null },
        { assignedTo: req.user._id },
      ],
    };

    const [allTasks, periodTasks, projects] = await Promise.all([
      Task.find(taskAccessQuery),
      Task.find({ ...taskAccessQuery, createdAt: { $gte: start, $lte: end } }),
      Project.find({ $or: [{ owner: req.user._id }, { members: { $elemMatch: { user: req.user._id, status: "accepted" } } }] }),
    ]);

    const now = new Date();
    const completed = allTasks.filter((t) => t.status === "completed").length;
    const overdue = allTasks.filter((t) => t.dueDate && t.status !== "completed" && new Date(t.dueDate) < now).length;
    const completionRate = allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0;
    const categoryMap = {};
    for (const task of allTasks) {
      const key = task.category || "Uncategorized";
      categoryMap[key] = (categoryMap[key] || 0) + 1;
    }
    const tasksByCategory = Object.entries(categoryMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const tasksByDayMap = {};
    for (const t of periodTasks) {
      const d = new Date(t.createdAt).toISOString().slice(0, 10);
      tasksByDayMap[d] = (tasksByDayMap[d] || 0) + 1;
    }
    const tasksByDay = Object.entries(tasksByDayMap).map(([date, count]) => ({ date, count }));
    const tasksPerDay = tasksByDay.length ? Number((periodTasks.length / tasksByDay.length).toFixed(2)) : 0;
    const tasksPerWeek = Number((tasksPerDay * 7).toFixed(2));

    const completedWithDuration = allTasks.filter((t) => t.status === "completed" && t.updatedAt && t.createdAt);
    const avgCompletionMs = completedWithDuration.length
      ? completedWithDuration.reduce((sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)), 0) / completedWithDuration.length
      : 0;
    const avgCompletionHours = Number((avgCompletionMs / (1000 * 60 * 60)).toFixed(2));

    const projectCompletion = projects.map((p) => ({
      id: p._id,
      title: p.title,
      progress: p.progress || 0,
      status: p.status,
    }));

    const dayProductivity = {};
    for (const t of allTasks) {
      if (t.status !== "completed") continue;
      const day = new Date(t.updatedAt || t.createdAt).toLocaleDateString("en-US", { weekday: "short" });
      dayProductivity[day] = (dayProductivity[day] || 0) + 1;
    }
    const mostProductiveDay = Object.entries(dayProductivity).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const delayedCategoryMap = {};
    for (const t of allTasks) {
      if (!(t.dueDate && t.status !== "completed" && new Date(t.dueDate) < now)) continue;
      const key = t.priority || "unknown";
      delayedCategoryMap[key] = (delayedCategoryMap[key] || 0) + 1;
    }
    const mostDelayedCategory = Object.entries(delayedCategoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const topCategory = tasksByCategory[0]?.label || "N/A";

    res.status(200).json({
      success: true,
      data: {
        range,
        metrics: {
          total: allTasks.length,
          completed,
          createdInRange: periodTasks.length,
          overdue,
          completionRate,
          averageCompletionHours: avgCompletionHours,
          tasksPerDay,
          tasksPerWeek,
        },
        charts: {
          tasksByDay,
          tasksByCategory,
          statusDonut: [
            { label: "Completed", value: completed },
            { label: "Pending", value: allTasks.length - completed },
          ],
          projectCompletion,
        },
        insights: {
          mostProductiveDay,
          topCategory,
          mostDelayedCategory,
          highCompletionStreakSuggestion:
            completionRate >= 70
              ? "Strong momentum. Maintain your completion streak with consistent daily planning."
              : "Try reducing active task load and prioritize top-impact tasks first.",
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAnalytics };
