const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");

function projectAccessQuery(userId) {
  return {
    $or: [{ owner: userId }, { "members.user": userId }],
  };
}

async function recalcProjectProgress(projectId) {
  if (!projectId) return;
  const tasks = await Task.find({ projectId }, { status: 1 });
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  await Project.findByIdAndUpdate(projectId, { progress, tasks: tasks.map((t) => t._id) });
}

async function createProject(req, res, next) {
  try {
    const { title, description, category, color, status, startDate, targetDate, members = [] } = req.body;
    if (!title || title.trim().length < 3) {
      res.status(400);
      throw new Error("Project title must be at least 3 characters");
    }

    const project = await Project.create({
      owner: req.user._id,
      title: title.trim(),
      description: (description || "").trim(),
      category: (category || "General").trim(),
      color: color || "#0E7490",
      status: status || "active",
      startDate: startDate || null,
      targetDate: targetDate || null,
      members: [{ user: req.user._id, role: "owner" }, ...members],
      tasks: [],
      progress: 0,
    });

    await ActivityLog.create({
      user: req.user._id,
      actor: req.user._id,
      action: `Created project ${project.title}`,
      entityType: "project",
      entityId: project._id,
      meta: { projectId: project._id },
    });

    res.status(201).json({ success: true, message: "Project created", data: project });
  } catch (error) {
    next(error);
  }
}

async function getProjects(req, res, next) {
  try {
    const projects = await Project.find(projectAccessQuery(req.user._id))
      .populate("owner", "fullName email avatar")
      .populate("members.user", "fullName email avatar")
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
}

async function getProjectById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404);
      throw new Error("Project not found");
    }
    const project = await Project.findOne({ _id: req.params.id, ...projectAccessQuery(req.user._id) })
      .populate("owner", "fullName email avatar")
      .populate("members.user", "fullName email avatar");
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    const tasks = await Task.find({ projectId: project._id, user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { project, tasks } });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...projectAccessQuery(req.user._id) });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    const { title, description, category, color, status, startDate, targetDate, members } = req.body;
    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = String(description || "").trim();
    if (category !== undefined) project.category = String(category || "General").trim();
    if (color !== undefined) project.color = color || "#0E7490";
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate || null;
    if (targetDate !== undefined) project.targetDate = targetDate || null;
    if (members !== undefined && Array.isArray(members)) {
      project.members = members;
    }
    await project.save();

    await ActivityLog.create({
      user: req.user._id,
      actor: req.user._id,
      action: `Updated project ${project.title}`,
      entityType: "project",
      entityId: project._id,
      meta: { projectId: project._id },
    });

    res.status(200).json({ success: true, message: "Project updated", data: project });
  } catch (error) {
    next(error);
  }
}

async function archiveProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...projectAccessQuery(req.user._id) });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }
    project.status = "archived";
    await project.save();
    res.status(200).json({ success: true, message: "Project archived", data: project });
  } catch (error) {
    next(error);
  }
}

async function deleteProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) {
      res.status(404);
      throw new Error("Project not found or not owned by user");
    }
    await Task.updateMany({ projectId: project._id, user: req.user._id }, { $set: { projectId: null } });
    await project.deleteOne();
    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    next(error);
  }
}

async function linkTaskToProject(req, res, next) {
  try {
    const { taskId } = req.body;
    const project = await Project.findOne({ _id: req.params.id, ...projectAccessQuery(req.user._id) });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    task.projectId = project._id;
    await task.save();
    await recalcProjectProgress(project._id);
    res.status(200).json({ success: true, message: "Task linked to project" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  deleteProject,
  linkTaskToProject,
  recalcProjectProgress,
};
