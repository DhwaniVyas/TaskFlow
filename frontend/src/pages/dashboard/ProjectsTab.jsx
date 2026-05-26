import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiFolder, FiMail, FiMessageSquare, FiUsers } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

const initialProject = {
  title: "",
  description: "",
  color: "#0E7490",
  startDate: "",
  targetDate: "",
};

const initialProjectTask = {
  title: "",
  description: "",
  category: "Work",
  priority: "medium",
  status: "todo",
  dueDate: "",
  scheduledDate: "",
  estimatedDuration: "",
  assignedTo: "",
};

const categories = ["Work", "Study", "Personal", "Meeting", "Development", "Design", "Operations"];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "N/A";
}

function buildCommentThreads(comments) {
  const byId = new Map();
  const roots = [];

  for (const comment of comments) {
    byId.set(String(comment._id), { ...comment, replies: [] });
  }

  for (const comment of byId.values()) {
    const parentId = comment.replyTo?._id || comment.replyTo;
    if (parentId && byId.has(String(parentId))) {
      byId.get(String(parentId)).replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

function CommentThread({ comment, level = 0, onReply }) {
  const authorName = comment.user?.fullName || "User";

  return (
    <div className={`rounded-xl bg-white p-3.5 transition-all ${
      level > 0 
        ? "ml-4 mt-2 border-l-2 border-[#E2F4F6] pl-4" 
        : "border border-[#E2F4F6] shadow-sm"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#082F38]">{authorName}</p>
          <p className="text-xs text-[#5B9EA8]">{new Date(comment.createdAt).toLocaleString()}</p>
        </div>
        <button className="btn btn-secondary !text-xs" onClick={() => onReply(comment)}>
          Reply
        </button>
      </div>
      {comment.replyTo?.user && (
        <p className="text-xs text-[#0E7490] mt-2">Replying to {comment.replyTo.user.fullName}</p>
      )}
      <p className="text-sm text-[#082F38] mt-2 whitespace-pre-wrap">{comment.message}</p>

      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread key={reply._id} comment={reply} level={level + 1} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsTab() {
  const { showToast, dashboardData } = useDashboardWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState(initialProject);
  const [invite, setInvite] = useState({ projectId: "", email: "", role: "member" });
  const [openProject, setOpenProject] = useState(null);
  const [taskForm, setTaskForm] = useState(initialProjectTask);
  const [showTaskScheduling, setShowTaskScheduling] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [comments, setComments] = useState([]);
  const [commentMessage, setCommentMessage] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const userId = dashboardData?.user?.id;

  const headedProjects = useMemo(
    () => projects.filter((project) => project.owner?._id === userId),
    [projects, userId]
  );

  const acceptedMembers = (openProject?.project?.members || []).filter((member) => member.status === "accepted");
  const pendingMembers = (openProject?.project?.members || []).filter((member) => member.status === "pending");
  const isProjectHead = openProject ? openProject.project.owner?._id === userId : false;
  const selectedTask = (openProject?.tasks || []).find((task) => task._id === selectedTaskId);
  const threadedComments = useMemo(() => buildCommentThreads(comments), [comments]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/projects");
      setProjects(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchProjectDetails = async (projectId) => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setOpenProject(data.data);
      return data.data;
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load project workspace");
      return null;
    }
  };

  const fetchComments = async (taskId) => {
    if (!taskId) {
      setComments([]);
      return;
    }
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      setComments(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load comments");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const inviteToken = searchParams.get("inviteToken");
    if (!inviteToken) return;
    (async () => {
      try {
        await api.post("/projects/accept-invite", { token: inviteToken });
        showToast("Project invitation accepted");
        setSearchParams({});
        await fetchProjects();
      } catch (err) {
        showToast(err?.response?.data?.message || "Failed to accept invitation");
      }
    })();
  }, [fetchProjects, searchParams, setSearchParams, showToast]);

  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(initialProject);
    setShowProjectModal(true);
  };

  const openEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      color: project.color || "#0E7490",
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
      targetDate: project.targetDate ? new Date(project.targetDate).toISOString().slice(0, 10) : "",
    });
    setShowProjectModal(true);
  };

  const resetTaskComposer = () => {
    setEditingTaskId("");
    setTaskForm(initialProjectTask);
    setShowTaskScheduling(false);
  };

  const saveProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject._id}`, projectForm);
        showToast("Project updated");
      } else {
        await api.post("/projects", projectForm);
        showToast("Project created");
      }
      setShowProjectModal(false);
      setProjectForm(initialProject);
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save project");
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects/invite", invite);
      showToast("Invitation email sent");
      setInvite({ projectId: "", email: "", role: "member" });
      await fetchProjects();
      if (openProject?.project?._id === invite.projectId) {
        await fetchProjectDetails(invite.projectId);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to invite member");
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${projectId}`);
      showToast("Project deleted");
      if (openProject?.project?._id === projectId) {
        setOpenProject(null);
      }
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete project");
    }
  };

  const archiveProject = async (projectId) => {
    try {
      await api.patch(`/projects/${projectId}/archive`);
      showToast("Project archived");
      await fetchProjects();
      if (openProject?.project?._id === projectId) {
        await fetchProjectDetails(projectId);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to archive project");
    }
  };

  const beginTaskEdit = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "Work",
      priority: task.priority || "medium",
      status: task.status || "todo",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().slice(0, 10) : "",
      estimatedDuration: task.estimatedDuration ?? "",
      assignedTo: task.assignedTo || "",
    });
    setShowTaskScheduling(Boolean(task.scheduledDate));
  };

  const saveProjectTask = async (e) => {
    e.preventDefault();
    if (!openProject?.project?._id) return;
    try {
      const payload = {
        ...taskForm,
        projectId: openProject.project._id,
        assignedTo: taskForm.assignedTo || null,
        scheduledDate: showTaskScheduling ? taskForm.scheduledDate || null : null,
        estimatedDuration: showTaskScheduling && taskForm.estimatedDuration !== "" ? Number(taskForm.estimatedDuration) : null,
      };
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
        if (taskForm.assignedTo) {
          await api.patch(`/tasks/${editingTaskId}/assign`, { assigneeId: taskForm.assignedTo });
        }
        showToast("Project task updated");
      } else {
        const { data } = await api.post("/tasks", payload);
        if (taskForm.assignedTo) {
          await api.patch(`/tasks/${data.data._id}/assign`, { assigneeId: taskForm.assignedTo });
        }
        showToast("Project task created");
      }
      resetTaskComposer();
      await fetchProjectDetails(openProject.project._id);
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save project task");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      showToast("Task deleted");
      if (selectedTaskId === taskId) {
        setSelectedTaskId("");
        setComments([]);
      }
      await fetchProjectDetails(openProject.project._id);
      await fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete task");
    }
  };

  const completeTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: "completed" });
      showToast("Task marked complete");
      await fetchProjectDetails(openProject.project._id);
      await fetchProjects();
      if (selectedTaskId === taskId) {
        await fetchComments(taskId);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update task status");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!selectedTaskId || !commentMessage.trim()) return;
    try {
      await api.post(`/tasks/${selectedTaskId}/comments`, {
        message: commentMessage.trim(),
        replyTo: replyTarget?._id || null,
      });
      setCommentMessage("");
      setReplyTarget(null);
      await fetchComments(selectedTaskId);
      showToast("Comment added");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add comment");
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#082F38]">Projects Workspace</h2>
            <p className="text-sm text-[#5B9EA8] mt-1">
              Keep cards compact here, then open a project for full collaboration, ownership controls, and discussion.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateProject}>Create Project</button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="card p-6 text-[#5B9EA8]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card p-6 text-[#5B9EA8]">No projects yet. Create your first project.</div>
        ) : (
          projects.map((project) => {
            const headName = project.owner?.fullName || "Project Head";
            const isHeadProject = project.owner?._id === userId;
            return (
              <div key={project._id} className="card p-5" style={{ borderColor: `${project.color}55` }}>
                <div className="h-1.5 rounded-full mb-4" style={{ background: project.color }} />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: project.color }}>{project.title}</h3>
                    <p className="text-sm text-[#5B9EA8] mt-1 line-clamp-3">{project.description || "No description"}</p>
                  </div>
                  <div className="text-sm text-[#5B9EA8]">
                    <p>Head: <span className="font-medium text-[#082F38]">{headName}</span></p>
                  </div>
                </div>
                <div className="equal-split-row compact mt-5" style={{ "--split-count": isHeadProject ? 4 : 1 }}>
                  <button className="btn btn-secondary !text-xs" onClick={() => fetchProjectDetails(project._id)}>Open</button>
                  {isHeadProject && <button className="btn btn-secondary !text-xs" onClick={() => openEditProject(project)}>Edit</button>}
                  {isHeadProject && <button className="btn btn-secondary !text-xs" onClick={() => archiveProject(project._id)}>Archive</button>}
                  {isHeadProject && <button className="btn btn-accent !text-xs" onClick={() => deleteProject(project._id)}>Delete</button>}
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold text-[#082F38]">Invite Member</h3>
        {headedProjects.length === 0 ? (
          <p className="text-sm text-[#5B9EA8] mt-3">Create a project as head first, then invite collaborators by email.</p>
        ) : (
          <form onSubmit={sendInvite} className="equal-split-row relaxed mt-3" style={{ "--split-count": 4 }}>
            <select className="form-select" value={invite.projectId} onChange={(e) => setInvite((prev) => ({ ...prev, projectId: e.target.value }))} required>
              <option value="">Select Project</option>
              {headedProjects.map((project) => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </select>
            <input className="form-input" type="email" placeholder="Collaborator email" value={invite.email} onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))} required />
            <select className="form-select" value={invite.role} onChange={(e) => setInvite((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="btn btn-primary" type="submit">Send Invite</button>
          </form>
        )}
      </section>

      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-[var(--surface)] rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-[var(--line-soft)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{editingProject ? "Edit Project" : "Create Project"}</h3>
            <form onSubmit={saveProject} className="space-y-4">
              <input className="form-input w-full" placeholder="Project name" value={projectForm.title} onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))} required />
              <textarea className="form-textarea w-full" rows={4} placeholder="Project description" value={projectForm.description} onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))} />
              <div className="equal-split-row relaxed" style={{ "--split-count": 3 }}>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Project Color</p>
                  <input type="color" className="form-input h-[44px]" value={projectForm.color} onChange={(e) => setProjectForm((prev) => ({ ...prev, color: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Start Date</p>
                  <input type="date" className="form-input" value={projectForm.startDate} onChange={(e) => setProjectForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Deadline</p>
                  <input type="date" className="form-input" value={projectForm.targetDate} onChange={(e) => setProjectForm((prev) => ({ ...prev, targetDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProject ? "Save Project" : "Create Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-6">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto border border-[var(--line-soft)]">
            <div className="p-6 border-b" style={{ borderColor: `${openProject.project.color}55` }}>
              <div className="h-1.5 rounded-full mb-5" style={{ background: openProject.project.color }} />
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold" style={{ color: openProject.project.color }}>{openProject.project.title}</h3>
                  <p className="text-sm text-[#5B9EA8] mt-1">{openProject.project.description || "No description"}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#5B9EA8]">
                    <span>Head: {openProject.project.owner?.fullName || "N/A"}</span>
                    <span>Collaborators: {Math.max(acceptedMembers.length - 1, 0)}</span>
                    <span>Start: {formatDate(openProject.project.startDate)}</span>
                    <span>Deadline: {formatDate(openProject.project.targetDate)}</span>
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={() => setOpenProject(null)}>Close</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="equal-split-row relaxed" style={{ "--split-count": 4 }}>
                <div className="card p-5">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Status</p>
                  <p className="text-lg font-semibold mt-2" style={{ color: openProject.project.color }}>{openProject.project.status}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Progress</p>
                  <p className="text-lg font-semibold text-[#082F38] mt-2">{openProject.project.progress || 0}%</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Accepted Members</p>
                  <p className="text-lg font-semibold text-[#082F38] mt-2">{acceptedMembers.length}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Project Tasks</p>
                  <p className="text-lg font-semibold text-[#082F38] mt-2">{(openProject.tasks || []).length}</p>
                </div>
              </div>

              <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
                <div className="space-y-4">
                  {isProjectHead && (
                    <div className="card p-6" style={{ borderColor: `${openProject.project.color}55` }}>
                      <h4 className="text-lg font-semibold text-[#082F38] mb-4">{editingTaskId ? "Edit Project Task" : "Create Project Task"}</h4>
                      <form onSubmit={saveProjectTask} className="space-y-4">
                        <div className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
                          <input className="form-input w-full" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} required />
                          <select className="form-select" value={taskForm.category} onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))} required>
                            {categories.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <textarea className="form-textarea w-full" rows={3} placeholder="Task description" value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} />
                        <div className="equal-split-row relaxed" style={{ "--split-count": 4 }}>
                          <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} required>
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                          <select className="form-select" value={taskForm.status} onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))} required>
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <select className="form-select" value={taskForm.assignedTo} onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))}>
                            <option value="">Assign Later</option>
                            {acceptedMembers.map((member) => (
                              <option key={member.user?._id || member.email} value={member.user?._id || ""}>
                                {member.user?.fullName || member.email}
                              </option>
                            ))}
                          </select>
                          <div className="space-y-1">
                            <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Deadline</p>
                            <input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#E2F4F6] bg-[#F8FCFD] px-4 py-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="font-medium text-[#082F38]">Optional Scheduling & Estimates</p>
                              <p className="text-xs text-[#5B9EA8] mt-1">Add planned work date or duration details only where necessary.</p>
                            </div>
                            <button type="button" className="btn btn-secondary !text-xs" onClick={() => setShowTaskScheduling((prev) => !prev)}>
                              {showTaskScheduling ? "Hide Optional Scheduling" : "Add Optional Scheduling"}
                            </button>
                          </div>
                          {showTaskScheduling && (
                            <div className="equal-split-row relaxed mt-4" style={{ "--split-count": 2 }}>
                              <div className="space-y-1">
                                <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Planning Date</p>
                                <input type="date" className="form-input w-full" value={taskForm.scheduledDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, scheduledDate: e.target.value }))} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Estimated Hours</p>
                                <input
                                  type="number"
                                  min="0"
                                  className="form-input w-full"
                                  value={taskForm.estimatedDuration}
                                  onChange={(e) => setTaskForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))}
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="equal-split-row compact md:ml-auto md:max-w-sm" style={{ "--split-count": editingTaskId ? 2 : 1 }}>
                          {editingTaskId && <button type="button" className="btn btn-secondary" onClick={resetTaskComposer}>Cancel Edit</button>}
                          <button type="submit" className="btn btn-primary">{editingTaskId ? "Save Task" : "Create Task"}</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="card p-6" style={{ borderColor: `${openProject.project.color}55` }}>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-[#082F38]">Project Tasks</h4>
                        <p className="text-sm text-[#5B9EA8] mt-1">Everyone can see all project work, but only the head can fully manage it.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(openProject.tasks || []).length === 0 ? (
                        <p className="text-sm text-[#5B9EA8]">No project tasks yet.</p>
                      ) : (
                        openProject.tasks.map((task) => {
                          const assignee = acceptedMembers.find((member) => member.user?._id === task.assignedTo);
                          const canCompleteTask = isProjectHead || String(task.assignedTo || "") === String(userId);
                          return (
                            <div key={task._id} className="rounded-xl border p-4 bg-white" style={{ borderColor: `${openProject.project.color}55` }}>
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-semibold text-[#082F38]">{task.title}</h5>
                                    <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full" style={{ background: `${openProject.project.color}14`, color: openProject.project.color }}>
                                      {task.category || "General"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-[#5B9EA8] mt-1">{task.description || "No description"}</p>
                                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                    <span className="badge badge-status-due-soon">{task.priority}</span>
                                    <span className={`badge ${task.status === "completed" ? "badge-status-done" : task.status === "in_progress" ? "badge-status-in-progress" : "badge-status-todo"}`}>
                                      {task.status.replace("_", " ")}
                                    </span>
                                    <span className="text-[#5B9EA8]">Deadline: {formatDate(task.dueDate)}</span>
                                    {task.scheduledDate && <span className="text-[#5B9EA8]">Planned: {formatDate(task.scheduledDate)}</span>}
                                    {task.estimatedDuration && <span className="text-[#5B9EA8]">Est: {task.estimatedDuration}h</span>}
                                    <span className="text-[#5B9EA8]">Assigned: {assignee?.user?.fullName || "Unassigned"}</span>
                                  </div>
                                </div>

                                <div className="equal-split-row compact w-full lg:w-[360px]" style={{ "--split-count": isProjectHead ? 4 : 2 }}>
                                  {isProjectHead && <button className="btn btn-secondary !text-xs" onClick={() => beginTaskEdit(task)}>Edit</button>}
                                  {task.status !== "completed" && canCompleteTask && <button className="btn btn-secondary !text-xs" onClick={() => completeTask(task._id)}>Mark Complete</button>}
                                  <button className="btn btn-secondary !text-xs" onClick={() => {
                                    setSelectedTaskId(task._id);
                                    setReplyTarget(null);
                                    fetchComments(task._id);
                                  }}>
                                    Discuss
                                  </button>
                                  {isProjectHead && <button className="btn btn-accent !text-xs" onClick={() => deleteTask(task._id)}>Delete</button>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="card p-6">
                    <h4 className="text-lg font-semibold text-[#082F38] mb-4">Collaborators</h4>
                    <div className="space-y-2">
                      {acceptedMembers.map((member, index) => (
                        <div key={`${member.email}-${index}`} className="rounded-lg border border-[#E2E8F0] p-3">
                          <p className="font-medium text-[#082F38]">{member.user?.fullName || member.email}</p>
                          <p className="text-xs text-[#5B9EA8]">{member.role === "owner" ? "Head" : "Collaborator"} | accepted</p>
                        </div>
                      ))}
                      {pendingMembers.length > 0 && (
                        <div className="rounded-xl border border-dashed border-[#E2E8F0] p-3 bg-[#F8FCFD]">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#5B9EA8] mb-2">Pending Invitations</p>
                          <div className="space-y-2">
                            {pendingMembers.map((member, index) => (
                              <div key={`pending-${member.email}-${index}`} className="text-sm text-[#5B9EA8]">
                                {member.email} | {member.role}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-[#082F38]">Task Discussion</h4>
                        <p className="text-sm text-[#5B9EA8] mt-1">Questions, recommendations, updates, and replies stay attached to the relevant task.</p>
                      </div>
                      {selectedTask && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${openProject.project.color}14`, color: openProject.project.color }}>
                          {selectedTask.title}
                        </span>
                      )}
                    </div>

                    {!selectedTaskId ? (
                      <p className="text-sm text-[#5B9EA8] mt-4">Choose a project task to start the conversation.</p>
                    ) : (
                      <div className="space-y-4 mt-4">
                        <div className="max-h-72 overflow-y-auto space-y-3">
                          {threadedComments.length === 0 ? (
                            <p className="text-sm text-[#5B9EA8]">No comments yet.</p>
                          ) : (
                            threadedComments.map((comment) => (
                              <CommentThread key={comment._id} comment={comment} onReply={setReplyTarget} />
                            ))
                          )}
                        </div>

                        <form onSubmit={submitComment} className="space-y-2">
                          {replyTarget && (
                            <div className="rounded-lg border border-[#E2F4F6] bg-[#F8FCFD] px-3 py-2 text-xs text-[#5B9EA8] flex items-center justify-between gap-2">
                              <span>Replying to {replyTarget.user?.fullName || "User"}</span>
                              <button type="button" className="text-[#0E7490] font-semibold" onClick={() => setReplyTarget(null)}>
                                Clear
                              </button>
                            </div>
                          )}
                          <textarea className="form-textarea w-full" rows={3} placeholder="Ask a question or leave a recommendation..." value={commentMessage} onChange={(e) => setCommentMessage(e.target.value)} />
                          <button className="btn btn-primary" type="submit">Post Comment</button>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="card p-6">
                    <h4 className="text-lg font-semibold text-[#082F38] mb-4">Workspace Rules</h4>
                    <div className="space-y-3 text-sm text-[#5B9EA8]">
                      <p className="flex items-center gap-2"><FiFolder /> Project heads manage project structure, tasks, and assignments.</p>
                      <p className="flex items-center gap-2"><FiUsers /> Collaborators can view everything after invite acceptance, join discussion, and complete their own assigned work.</p>
                      <p className="flex items-center gap-2"><FiMail /> Pending invitees cannot see this workspace until they explicitly accept.</p>
                      <p className="flex items-center gap-2"><FiMessageSquare /> Discussions stay contextual to the task so collaboration remains traceable.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
