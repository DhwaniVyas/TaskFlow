const mongoose = require("mongoose");
const Task = require("../models/Task");

const allowedStatus = ["todo", "in_progress", "completed"];
const allowedPriority = ["low", "medium", "high"];

function parseDueFilter(due) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startDayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

  if (due === "today") return { dueDate: { $gte: startToday, $lt: startTomorrow } };
  if (due === "tomorrow") return { dueDate: { $gte: startTomorrow, $lt: startDayAfter } };
  if (due === "overdue") return { dueDate: { $lt: now }, status: { $ne: "completed" } };
  if (due === "upcoming") return { dueDate: { $gte: now } };
  return null;
}

function validateTaskInput(body, isUpdate = false) {
  const errors = [];
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!isUpdate || has("title")) {
    const title = String(body.title || "").trim();
    if (title.length < 3 || title.length > 100) errors.push("Title must be 3-100 characters");
  }
  if (has("description") && String(body.description || "").length > 1000) {
    errors.push("Description max length is 1000 characters");
  }
  if (has("status") && !allowedStatus.includes(body.status)) {
    errors.push("Invalid status value");
  }
  if (has("priority") && !allowedPriority.includes(body.priority)) {
    errors.push("Invalid priority value");
  }
  if (has("dueDate") && body.dueDate) {
    const dueDate = new Date(body.dueDate);
    if (Number.isNaN(dueDate.getTime())) errors.push("Invalid due date");
  }
  if (has("scheduledDate") && body.scheduledDate) {
    const scheduledDate = new Date(body.scheduledDate);
    if (Number.isNaN(scheduledDate.getTime())) errors.push("Invalid scheduled date");
  }
  if (has("estimatedDuration") && body.estimatedDuration !== null && body.estimatedDuration !== undefined) {
    const duration = Number(body.estimatedDuration);
    if (Number.isNaN(duration) || duration < 0) errors.push("estimatedDuration must be a positive number");
  }
  if (has("subtasks")) {
    if (!Array.isArray(body.subtasks)) errors.push("Subtasks must be an array");
    else if (body.subtasks.length > 20) errors.push("Subtasks limit is 20");
  }

  return errors;
}

async function findOwnedTask(taskId, userId) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) return null;
  return Task.findOne({ _id: taskId, user: userId });
}

async function createTask(req, res, next) {
  try {
    const errors = validateTaskInput(req.body, false);
    if (errors.length) {
      res.status(400);
      throw new Error(errors.join(", "));
    }

    const task = await Task.create({
      user: req.user._id,
      title: req.body.title.trim(),
      description: req.body.description?.trim() || "",
      status: req.body.status || "todo",
      priority: req.body.priority || "medium",
      dueDate: req.body.dueDate || null,
      scheduledDate: req.body.scheduledDate || null,
      estimatedDuration: req.body.estimatedDuration ?? null,
      subtasks: (req.body.subtasks || []).map((subtask) => ({
        title: String(subtask.title || "").trim(),
        completed: Boolean(subtask.completed),
      })),
    });

    res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (error) {
    next(error);
  }
}

async function getTasks(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10), 1), 100);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments({ user: req.user._id }),
    ]);
    res.status(200).json({
      success: true,
      data: tasks,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await findOwnedTask(req.params.id, req.user._id);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const errors = validateTaskInput(req.body, true);
    if (errors.length) {
      res.status(400);
      throw new Error(errors.join(", "));
    }

    const task = await findOwnedTask(req.params.id, req.user._id);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.description !== undefined) task.description = String(req.body.description || "").trim();
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || null;
    if (req.body.scheduledDate !== undefined) task.scheduledDate = req.body.scheduledDate || null;
    if (req.body.estimatedDuration !== undefined) task.estimatedDuration = req.body.estimatedDuration ?? null;
    if (req.body.subtasks !== undefined) {
      task.subtasks = req.body.subtasks.map((subtask) => ({
        title: String(subtask.title || "").trim(),
        completed: Boolean(subtask.completed),
      }));
    }

    await task.save();
    res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await findOwnedTask(req.params.id, req.user._id);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    await task.deleteOne();
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
}

async function searchTasks(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(200).json({ success: true, data: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const tasks = await Task.find({
      user: req.user._id,
      $or: [{ title: regex }, { description: regex }, { "subtasks.title": regex }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

async function filterTasks(req, res, next) {
  try {
    const query = { user: req.user._id };
    const { status, priority, due, completed } = req.query;

    if (status && allowedStatus.includes(status)) query.status = status;
    if (priority && allowedPriority.includes(priority)) query.priority = priority;

    if (completed === "true") query.status = "completed";
    if (completed === "false") query.status = { $ne: "completed" };

    const dueFilter = parseDueFilter(due);
    if (dueFilter) Object.assign(query, dueFilter);

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

async function sortTasks(req, res, next) {
  try {
    const by = String(req.query.by || "createdAt");
    const order = String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;

    let sort = { createdAt: -1 };
    if (by === "createdAt") sort = { createdAt: order };
    if (by === "dueDate") sort = { dueDate: order, createdAt: -1 };
    if (by === "status") sort = { status: order, createdAt: -1 };
    if (by === "priority") {
      // high > medium > low for desc
      const tasks = await Task.aggregate([
        { $match: { user: req.user._id } },
        {
          $addFields: {
            priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "high"] }, then: 3 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityRank: order, createdAt: -1 } },
        { $project: { priorityRank: 0 } },
      ]);
      return res.status(200).json({ success: true, data: tasks });
    }

    const tasks = await Task.find({ user: req.user._id }).sort(sort);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!allowedStatus.includes(status)) {
      res.status(400);
      throw new Error("Invalid status value");
    }

    const task = await findOwnedTask(req.params.id, req.user._id);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    task.status = status;
    await task.save();
    res.status(200).json({ success: true, message: "Task status updated", data: task });
  } catch (error) {
    next(error);
  }
}

async function toggleSubtask(req, res, next) {
  try {
    const { subtaskId } = req.body;
    if (!subtaskId) {
      res.status(400);
      throw new Error("subtaskId is required");
    }

    const task = await findOwnedTask(req.params.id, req.user._id);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      res.status(404);
      throw new Error("Subtask not found");
    }

    subtask.completed = !subtask.completed;
    await task.save();
    res.status(200).json({ success: true, message: "Subtask updated", data: task });
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
