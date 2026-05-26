const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { recalcProjectProgress } = require("./projectController");

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
  if (has("category")) {
    const category = String(body.category || "").trim();
    if (category.length > 60) errors.push("Category max length is 60");
  }
  if (has("projectId") && body.projectId) {
    if (!mongoose.Types.ObjectId.isValid(body.projectId)) errors.push("Invalid project id");
  }
  if (has("assignedTo") && body.assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(body.assignedTo)) errors.push("Invalid assignee id");
  }

  return errors;
}

async function findOwnedTask(taskId, userId) {
  if (!mongoose.Types.ObjectId.isValid(taskId)) return null;
  const task = await Task.findById(taskId);
  if (!task) return null;

  const directAccess =
    String(task.creator || "") === String(userId) ||
    String(task.user || "") === String(userId) ||
    String(task.assignedTo || "") === String(userId);

  if (directAccess) return task;
  if (task.projectId && (await hasProjectAccess(task.projectId, userId))) return task;
  return null;
}

async function canManageProjectTask(task, userId) {
  if (!task?.projectId) return true;
  return isProjectOwner(task.projectId, userId);
}

function isAssignedProjectMember(task, userId) {
  return Boolean(task?.projectId) && String(task.assignedTo || "") === String(userId);
}

async function hasProjectAccess(projectId, userId) {
  if (!projectId) return true;
  if (!mongoose.Types.ObjectId.isValid(projectId)) return false;
  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: { $elemMatch: { user: userId, status: "accepted" } } }],
  });
  return Boolean(project);
}

async function isProjectOwner(projectId, userId) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return false;
  const project = await Project.findOne({ _id: projectId, owner: userId }).select("_id");
  return Boolean(project);
}

async function createTask(req, res, next) {
  try {
    const errors = validateTaskInput(req.body, false);
    if (errors.length) {
      res.status(400);
      throw new Error(errors.join(", "));
    }

    if (req.body.projectId && !(await isProjectOwner(req.body.projectId, req.user._id))) {
      res.status(403);
      throw new Error("Only the project head can create project tasks");
    }

    const task = await Task.create({
      user: req.user._id,
      creator: req.user._id,
      title: req.body.title.trim(),
      category: String(req.body.category || "Personal").trim() || "Personal",
      description: req.body.description?.trim() || "",
      status: req.body.status || "todo",
      priority: req.body.priority || "medium",
      projectId: req.body.projectId || null,
      assignedTo: req.body.assignedTo || null,
      assignedBy: req.body.assignedTo ? req.user._id : null,
      assignedAt: req.body.assignedTo ? new Date() : null,
      dueDate: req.body.dueDate || null,
      scheduledDate: req.body.scheduledDate || null,
      estimatedDuration: req.body.estimatedDuration ?? null,
      subtasks: (req.body.subtasks || []).map((subtask) => ({
        title: String(subtask.title || "").trim(),
        completed: Boolean(subtask.completed),
      })),
    });
    await recalcProjectProgress(task.projectId);

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

    const ownedProjects = await Project.find({ owner: req.user._id }).select("_id");
    const ownedProjectIds = ownedProjects.map((p) => p._id);
    const taskAccessQuery = {
      $or: [
        { creator: req.user._id, projectId: null },
        { user: req.user._id, projectId: null },
        { assignedTo: req.user._id, projectId: { $ne: null, $nin: ownedProjectIds } },
      ],
    };

    const [tasks, total] = await Promise.all([
      Task.find(taskAccessQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Task.countDocuments(taskAccessQuery),
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

    if (req.body.projectId && !(await isProjectOwner(req.body.projectId, req.user._id))) {
      res.status(403);
      throw new Error("Only the project head can move tasks into this project");
    }

    if (!(await canManageProjectTask(task, req.user._id))) {
      res.status(403);
      throw new Error("Only the project head can edit project tasks");
    }

    const oldProjectId = task.projectId ? String(task.projectId) : null;
    if (!task.creator) task.creator = task.user || req.user._id;
    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.description !== undefined) task.description = String(req.body.description || "").trim();
    if (req.body.category !== undefined) task.category = String(req.body.category || "Personal").trim() || "Personal";
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.projectId !== undefined) task.projectId = req.body.projectId || null;
    if (req.body.assignedTo !== undefined) {
      task.assignedTo = req.body.assignedTo || null;
      task.assignedBy = req.body.assignedTo ? req.user._id : null;
      task.assignedAt = req.body.assignedTo ? new Date() : null;
    }
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
    if (oldProjectId !== (task.projectId ? String(task.projectId) : null)) {
      await recalcProjectProgress(oldProjectId);
      await recalcProjectProgress(task.projectId);
    } else {
      await recalcProjectProgress(task.projectId);
    }
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
    if (!(await canManageProjectTask(task, req.user._id))) {
      res.status(403);
      throw new Error("Only the project head can delete project tasks");
    }
    const projectId = task.projectId;
    await task.deleteOne();
    await recalcProjectProgress(projectId);
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
}

async function searchTasks(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(200).json({ success: true, data: [] });

    const ownedProjects = await Project.find({ owner: req.user._id }).select("_id");
    const ownedProjectIds = ownedProjects.map((p) => p._id);
    const taskAccessQuery = {
      $or: [
        { creator: req.user._id, projectId: null },
        { user: req.user._id, projectId: null },
        { assignedTo: req.user._id, projectId: { $ne: null, $nin: ownedProjectIds } },
      ],
    };

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const tasks = await Task.find({
      $and: [
        taskAccessQuery,
        { $or: [{ title: regex }, { description: regex }, { "subtasks.title": regex }, { category: regex }] },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

async function filterTasks(req, res, next) {
  try {
    const ownedProjects = await Project.find({ owner: req.user._id }).select("_id");
    const ownedProjectIds = ownedProjects.map((p) => p._id);
    const query = {
      $or: [
        { creator: req.user._id, projectId: null },
        { user: req.user._id, projectId: null },
        { assignedTo: req.user._id, projectId: { $ne: null, $nin: ownedProjectIds } },
      ],
    };
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

    const ownedProjects = await Project.find({ owner: req.user._id }).select("_id");
    const ownedProjectIds = ownedProjects.map((p) => p._id);
    const taskAccessQuery = {
      $or: [
        { creator: req.user._id, projectId: null },
        { user: req.user._id, projectId: null },
        { assignedTo: req.user._id, projectId: { $ne: null, $nin: ownedProjectIds } },
      ],
    };

    let sort = { createdAt: -1 };
    if (by === "createdAt") sort = { createdAt: order };
    if (by === "dueDate") sort = { dueDate: order, createdAt: -1 };
    if (by === "status") sort = { status: order, createdAt: -1 };
    if (by === "priority") {
      // high > medium > low for desc
      const tasks = await Task.aggregate([
        {
          $match: taskAccessQuery,
        },
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

    const tasks = await Task.find(taskAccessQuery).sort(sort);
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

    if (task.projectId) {
      const canManage = await canManageProjectTask(task, req.user._id);
      if (!canManage) {
        const isAssignedMember = isAssignedProjectMember(task, req.user._id);
        if (!isAssignedMember || status !== "completed") {
          res.status(403);
          throw new Error("Project members can only mark their assigned tasks as completed");
        }
      }
    }

    task.status = status;
    await task.save();
    await recalcProjectProgress(task.projectId);
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
    if (!(await canManageProjectTask(task, req.user._id))) {
      res.status(403);
      throw new Error("Only the project head can edit subtasks");
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
