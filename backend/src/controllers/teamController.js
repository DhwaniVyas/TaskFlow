const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Comment = require("../models/Comment");
const ActivityLog = require("../models/ActivityLog");

async function inviteMember(req, res, next) {
  try {
    const { projectId, email, role = "member" } = req.body;
    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) {
      res.status(404);
      throw new Error("Project not found or not owned by user");
    }
    const invitedUser = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (!invitedUser) {
      res.status(404);
      throw new Error("User not found by email");
    }
    const alreadyMember = project.members.some((m) => String(m.user) === String(invitedUser._id));
    if (!alreadyMember) project.members.push({ user: invitedUser._id, role });
    await project.save();

    await ActivityLog.create({
      user: invitedUser._id,
      actor: req.user._id,
      action: `Invited to project ${project.title}`,
      entityType: "team",
      entityId: project._id,
      meta: { projectId: project._id, role },
    });

    res.status(200).json({ success: true, message: "Member invited", data: project });
  } catch (error) {
    next(error);
  }
}

async function assignTask(req, res, next) {
  try {
    const { taskId, assigneeId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400);
      throw new Error("Invalid task id");
    }
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      res.status(404);
      throw new Error("Assignee not found");
    }
    task.assignedTo = assignee._id;
    task.assignedBy = req.user._id;
    await task.save();

    await ActivityLog.create({
      user: req.user._id,
      actor: req.user._id,
      action: `Assigned task ${task.title} to ${assignee.fullName}`,
      entityType: "task",
      entityId: task._id,
      meta: { taskId: task._id, assigneeId: assignee._id },
    });

    res.status(200).json({ success: true, message: "Task assigned", data: task });
  } catch (error) {
    next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const { taskId, message, replyTo } = req.body;
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    if (!message || String(message).trim().length === 0) {
      res.status(400);
      throw new Error("Comment message is required");
    }
    const comment = await Comment.create({
      task: task._id,
      user: req.user._id,
      message: String(message).trim(),
      replyTo: replyTo || null,
    });

    await ActivityLog.create({
      user: req.user._id,
      actor: req.user._id,
      action: `Commented on task ${task.title}`,
      entityType: "comment",
      entityId: comment._id,
      meta: { taskId: task._id },
    });

    res.status(201).json({ success: true, message: "Comment added", data: comment });
  } catch (error) {
    next(error);
  }
}

async function getTaskComments(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    const comments = await Comment.find({ task: task._id }).populate("user", "fullName avatar").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
}

async function getActivity(req, res, next) {
  try {
    const logs = await ActivityLog.find({ user: req.user._id })
      .populate("actor", "fullName avatar email")
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  inviteMember,
  assignTask,
  addComment,
  getTaskComments,
  getActivity,
};
