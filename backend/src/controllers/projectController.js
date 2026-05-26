const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const ActivityLog = require("../models/ActivityLog");
const { createRandomToken, hashToken } = require("../utils/token");
const { sendEmail } = require("../utils/mailer");
const { env } = require("../config/env");

function projectAccessQuery(userId) {
  return {
    $or: [{ owner: userId }, { members: { $elemMatch: { user: userId, status: "accepted" } } }],
  };
}

function resolveAppUrl() {
  return (env.APP_URL || "http://localhost:5173").replace(/\/+$/, "");
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
    const { title, description, category, color, status, startDate, targetDate } = req.body;
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
      members: [{ user: req.user._id, email: req.user.email, role: "owner", status: "accepted", acceptedAt: new Date() }],
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

    const tasks = await Task.find({ projectId: project._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { project, tasks } });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
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
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
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
    await Task.updateMany({ projectId: project._id }, { $set: { projectId: null, assignedTo: null, assignedBy: null, assignedAt: null } });
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
    const task = await Task.findOne({ _id: taskId, $or: [{ creator: req.user._id }, { assignedTo: req.user._id }] });
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

async function inviteProjectMember(req, res, next) {
  try {
    const { projectId, email, role = "member" } = req.body;
    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) {
      res.status(404);
      throw new Error("Project not found or not owned by user");
    }
    const normalizedEmail = String(email || "").toLowerCase().trim();
    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Valid email is required");
    }
    const alreadyAccepted = project.members.some((m) => m.email === normalizedEmail && m.status === "accepted");
    if (alreadyAccepted) {
      res.status(409);
      throw new Error("Member already added");
    }
    const inviteToken = createRandomToken();
    const tokenHash = hashToken(inviteToken);
    project.members = project.members.filter((m) => !(m.email === normalizedEmail && m.status === "pending"));
    project.members.push({ email: normalizedEmail, role, status: "pending", inviteTokenHash: tokenHash, invitedAt: new Date() });
    await project.save();

    const inviteUrl = `${resolveAppUrl()}/dashboard/projects?inviteToken=${inviteToken}`;
    await sendEmail({
      to: normalizedEmail,
      subject: `TaskFlow invite: ${project.title}`,
      html: `<p>You were invited to collaborate on <b>${project.title}</b>.</p><p><a href="${inviteUrl}">Accept Invitation</a></p><p>${inviteUrl}</p>`,
    });

    res.status(200).json({ success: true, message: "Invitation sent" });
  } catch (error) {
    next(error);
  }
}

async function acceptProjectInvite(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      throw new Error("Invitation token is required");
    }
    const tokenHash = hashToken(token);
    const project = await Project.findOne({ members: { $elemMatch: { inviteTokenHash: tokenHash, status: "pending" } } }).select("+members.inviteTokenHash").populate("owner", "email fullName");
    if (!project) {
      res.status(400);
      throw new Error("Invalid or expired invitation");
    }

    const alreadyMember = project.members.some((m) => m.user && String(m.user) === String(req.user._id) && m.status === "accepted");
    if (alreadyMember) {
      res.status(400);
      throw new Error("You are already an accepted member of this project");
    }

    const member = project.members.find((m) => m.inviteTokenHash === tokenHash && m.status === "pending");
    if (!member || member.email !== req.user.email.toLowerCase().trim()) {
      res.status(403);
      throw new Error("Invite does not match this account");
    }
    member.user = req.user._id;
    member.status = "accepted";
    member.acceptedAt = new Date();
    member.inviteTokenHash = null;

    project.markModified("members");
    await project.save();

    await sendEmail({
      to: project.owner.email,
      subject: `Invite accepted: ${project.title}`,
      html: `<p>${req.user.fullName} (${req.user.email}) accepted your invite to <b>${project.title}</b>.</p>`,
    });

    const populated = await Project.findById(project._id)
      .populate("owner", "fullName email avatar")
      .populate("members.user", "fullName email avatar");

    res.status(200).json({ success: true, message: "Invitation accepted", data: populated });
  } catch (error) {
    next(error);
  }
}

async function getProjectComments(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...projectAccessQuery(req.user._id) });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }
    const tasks = await Task.find({ projectId: project._id }).select("_id");
    const taskIds = tasks.map((t) => t._id);
    const comments = await Comment.find({ task: { $in: taskIds } })
      .populate("user", "fullName email avatar")
      .populate("task", "title")
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

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  archiveProject,
  deleteProject,
  linkTaskToProject,
  inviteProjectMember,
  acceptProjectInvite,
  recalcProjectProgress,
  getProjectComments,
};
