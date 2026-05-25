const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Comment = require("../models/Comment");
const ActivityLog = require("../models/ActivityLog");

async function hasProjectMemberAccess(projectId, userId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return false;
  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: { $elemMatch: { user: userId, status: "accepted" } } }],
  });
  return project;
}

async function assignTask(req, res, next) {
  try {
    const { assigneeId } = req.body;
    const taskId = req.params.taskId;
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
      res.status(400);
      throw new Error("Invalid task or assignee id");
    }
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    const project = task.projectId ? await Project.findById(task.projectId) : null;
    if (project) {
      if (String(project.owner) !== String(req.user._id)) {
        res.status(403);
        throw new Error("Only the project owner can assign project tasks");
      }
    } else if (String(task.creator || task.user) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Only the task creator can assign this task");
    }
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      res.status(404);
      throw new Error("Assignee not found");
    }
    if (project) {
      const isMember = project.members.some((member) => String(member.user) === String(assignee._id) && member.status === "accepted");
      if (!isMember && String(project.owner) !== String(assignee._id)) {
        res.status(400);
        throw new Error("Assignee must be an accepted project member");
      }
    }
    task.assignedTo = assignee._id;
    task.assignedBy = req.user._id;
    task.assignedAt = new Date();
    await task.save();

    await ActivityLog.create({
      user: assignee._id,
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
    const { message, replyTo } = req.body;
    const taskId = req.params.taskId;
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    if (task.projectId) {
      const project = await hasProjectMemberAccess(task.projectId, req.user._id);
      if (!project) {
        res.status(403);
        throw new Error("You do not have access to this project");
      }
    } else if (
      String(task.creator || "") !== String(req.user._id) &&
      String(task.user || "") !== String(req.user._id) &&
      String(task.assignedTo || "") !== String(req.user._id)
    ) {
      res.status(403);
      throw new Error("You do not have access to this task");
    }
    if (!message || String(message).trim().length === 0) {
      res.status(400);
      throw new Error("Comment message is required");
    }

    if (replyTo) {
      if (!mongoose.Types.ObjectId.isValid(replyTo)) {
        res.status(400);
        throw new Error("Invalid reply target");
      }
      const parentComment = await Comment.findOne({ _id: replyTo, task: task._id }).select("_id");
      if (!parentComment) {
        res.status(404);
        throw new Error("Reply target not found in this task discussion");
      }
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

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "fullName avatar")
      .populate({
        path: "replyTo",
        populate: { path: "user", select: "fullName avatar" },
      });

    res.status(201).json({ success: true, message: "Comment added", data: populatedComment });
  } catch (error) {
    next(error);
  }
}

async function getTaskComments(req, res, next) {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }
    if (task.projectId) {
      const project = await hasProjectMemberAccess(task.projectId, req.user._id);
      if (!project) {
        res.status(403);
        throw new Error("You do not have access to this project");
      }
    } else if (
      String(task.creator || "") !== String(req.user._id) &&
      String(task.user || "") !== String(req.user._id) &&
      String(task.assignedTo || "") !== String(req.user._id)
    ) {
      res.status(403);
      throw new Error("You do not have access to this task");
    }
    const comments = await Comment.find({ task: task._id })
      .populate("user", "fullName avatar")
      .populate({
        path: "replyTo",
        populate: { path: "user", select: "fullName avatar" },
      })
      .sort({ createdAt: 1 });
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
  assignTask,
  addComment,
  getTaskComments,
  getActivity,
};
