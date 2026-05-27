import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiFolder, FiMail, FiMessageSquare, FiUsers, FiClock, FiPlus, FiEdit2, FiTrash2, FiUser, FiCheckCircle } from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { clearToken } from "../../utils/auth";
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
  category: "",
  priority: "",
  status: "",
  dueDate: "",
  scheduledDate: "",
  estimatedDuration: "",
  assignedTo: "",
  subtasks: [],
};

const categories = ["Work", "Study", "Personal", "Meeting", "Development", "Design", "Operations"];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "N/A";
}

function formatDateTimeLocal(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDeadline(dateString) {
  if (!dateString) return "No deadline";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "No deadline";
  
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day} ${month} ${year} — ${hours}:${minutes} ${ampm}`;
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
  const taskTitle = comment.task?.title || "Project Task";

  return (
    <div className={`rounded-xl bg-[var(--surface)] p-3.5 transition-all ${
      level > 0 
        ? "ml-4 mt-2 border-l-2 border-[var(--line-soft)] pl-4" 
        : "border border-[var(--line-soft)] shadow-sm"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{authorName}</p>
          <p className="text-xs text-[var(--text-muted)] font-medium">On Task: <span className="text-[var(--brand-primary)]">{taskTitle}</span></p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{new Date(comment.createdAt).toLocaleString()}</p>
        </div>
        <button className="btn btn-secondary !text-xs" onClick={() => onReply(comment)}>
          Reply
        </button>
      </div>
      {comment.replyTo?.user && (
        <p className="text-xs text-[var(--brand-primary)] mt-2">Replying to {comment.replyTo.user.fullName}</p>
      )}
      <p className="text-sm text-[var(--text-primary)] mt-2 whitespace-pre-wrap">{comment.message}</p>

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
  const { showToast, dashboardData, refreshDashboard } = useDashboardWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState(initialProject);
  const [invite, setInvite] = useState({ projectId: "", email: "", role: "" });
  const [openProject, setOpenProject] = useState(null);
  const [taskForm, setTaskForm] = useState(initialProjectTask);
  const [showTaskScheduling, setShowTaskScheduling] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [comments, setComments] = useState([]);
  const [commentMessage, setCommentMessage] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const userId = dashboardData?.user?.id;
  const [hoveredProjectId, setHoveredProjectId] = useState(null);

  const acceptedMembers = (openProject?.project?.members || []).filter((member) => member.status === "accepted");
  const pendingMembers = (openProject?.project?.members || []).filter((member) => member.status === "pending");
  const isProjectHead = openProject ? String(openProject.project.owner?._id || openProject.project.owner) === String(userId) : false;
  const userMembership = openProject?.project?.members?.find((m) => String(m.user?._id || m.user) === String(userId));
  const userRole = userMembership?.role || (isProjectHead ? "owner" : "viewer");
  const isViewer = userRole === "viewer";
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

  const fetchProjectComments = async (projectId) => {
    if (!projectId) {
      setComments([]);
      return;
    }
    try {
      const { data } = await api.get(`/projects/${projectId}/comments`);
      setComments(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load project comments");
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setOpenProject(data.data);
      await fetchProjectComments(projectId);
      return data.data;
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load project workspace");
      return null;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, dashboardData?.overview?.activeProjects]);

  useEffect(() => {
    const inviteToken = searchParams.get("inviteToken");
    if (!inviteToken) return;
    (async () => {
      try {
        await api.post("/projects/accept-invite", { token: inviteToken });
        showToast("Project invitation accepted");
        setSearchParams({});
        await Promise.all([fetchProjects(), refreshDashboard()]);
      } catch (err) {
        const msg = err?.response?.data?.message || "";
        if (msg.includes("Invite does not match this account")) {
          clearToken();
          navigate("/login");
          showToast("This invite is for a different email. Please log in with the correct account.");
        } else {
          showToast(msg || "Failed to accept invitation");
        }
      }
    })();
  }, [fetchProjects, searchParams, setSearchParams, showToast, refreshDashboard]);

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
      if (openProject?.project?._id) {
        await fetchProjectDetails(openProject.project._id);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save project");
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects/invite", invite);
      showToast("Invitation email sent");
      setInvite({ projectId: "", email: "", role: "" });
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

  const beginTaskEdit = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "",
      priority: task.priority || "",
      status: task.status || "",
      dueDate: task.dueDate ? formatDateTimeLocal(task.dueDate) : "",
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().slice(0, 10) : "",
      estimatedDuration: task.estimatedDuration ?? "",
      assignedTo: task.assignedTo || "",
      subtasks: (task.subtasks || []).map(s => ({ title: s.title, completed: s.completed })),
    });
    setShowTaskScheduling(Boolean(task.scheduledDate));
  };

  const saveProjectTask = async (e) => {
    e.preventDefault();
    if (!openProject?.project?._id) return;
    if (!taskForm.category) return showToast("Select a category.");
    if (!taskForm.priority) return showToast("Select a priority level.");
    if (!taskForm.status) return showToast("Select a status.");
    if (!taskForm.assignedTo) return showToast("Assign member is required.");

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
        showToast("Project task updated");
      } else {
        await api.post("/tasks", payload);
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
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update task status");
    }
  };

  const handleSubtaskToggle = async (taskId, subtaskId) => {
    try {
      await api.patch(`/tasks/${taskId}/subtasks`, { subtaskId });
      await fetchProjectDetails(openProject.project._id);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update subtask");
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
      await fetchProjectComments(openProject.project._id);
      showToast("Comment added");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add comment");
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6 border border-[var(--line-soft)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Projects Workspace</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Select any project from the list below to view its details, manage members, collaborate, or view project tasks.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateProject}>Create Project</button>
        </div>
      </section>

      {/* Project List View (compact and clean) */}
      <section className="space-y-3">
        {loading ? (
          <div className="card p-6 text-[var(--text-muted)] border border-[var(--line-soft)]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="card p-6 text-center text-[var(--text-muted)] border border-[var(--line-soft)]">No projects yet. Create your first project.</div>
        ) : (
          projects.map((project) => {
            const isHovered = hoveredProjectId === project._id;
            return (
              <div
                key={project._id}
                onClick={() => fetchProjectDetails(project._id)}
                onMouseEnter={() => setHoveredProjectId(project._id)}
                onMouseLeave={() => setHoveredProjectId(null)}
                className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer border border-[var(--line-soft)]"
                style={{
                  borderLeft: `5px solid ${project.color}`,
                  background: `linear-gradient(90deg, ${project.color}08 0%, var(--surface) 100%)`,
                  borderColor: isHovered ? project.color : undefined,
                  boxShadow: isHovered
                    ? `0 10px 25px -5px ${project.color}2A, 0 8px 10px -6px ${project.color}15`
                    : undefined,
                  transform: isHovered ? "translateY(-3px)" : undefined,
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors">{project.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-1">{project.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-32 bg-[var(--surface-subtle)] rounded-full h-2.5 overflow-hidden border border-[var(--line-soft)]">
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${project.progress || 0}%`,
                        background: project.color
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)] w-12 text-right">{project.progress || 0}%</span>
                </div>
              </div>
            );
          })
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
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Project Color</p>
                  <input type="color" className="form-input h-[44px]" value={projectForm.color} onChange={(e) => setProjectForm((prev) => ({ ...prev, color: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Start Date</p>
                  <input type="date" className="form-input" value={projectForm.startDate} onChange={(e) => setProjectForm((prev) => ({ ...prev, startDate: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Deadline</p>
                  <input type="date" className="form-input" value={projectForm.targetDate} onChange={(e) => setProjectForm((prev) => ({ ...prev, targetDate: e.target.value }))} required />
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
            
            {/* Section 1: Project Information Section */}
            <div className="p-6 border-b" style={{ borderColor: `${openProject.project.color}55` }}>
              <div className="h-1.5 rounded-full mb-5" style={{ background: openProject.project.color }} />
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h3 className="text-2xl font-bold" style={{ color: openProject.project.color }}>{openProject.project.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{openProject.project.description || "No description"}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 pt-3 border-t border-dashed border-[var(--line-soft)]">
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Start Date</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(openProject.project.startDate)}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Deadline</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{formatDate(openProject.project.targetDate)}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Progress</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{openProject.project.progress || 0}%</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Status</span>
                      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: openProject.project.color }}>
                        {openProject.project.status}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Members</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{acceptedMembers.length}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Your Role</span>
                      <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: openProject.project.color }}>
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isProjectHead && (
                    <>
                      <button className="btn btn-secondary !text-xs" onClick={() => openEditProject(openProject.project)}>Edit Project</button>
                      <button className="btn btn-accent !text-xs" onClick={() => deleteProject(openProject.project._id)}>Delete Project</button>
                    </>
                  )}
                  <button className="btn btn-secondary !text-xs" onClick={() => setOpenProject(null)}>Close</button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
                
                {/* Left Column: Form Panel & All Tasks list */}
                <div className="space-y-6">
                  
                  {/* Section 4: Create Project Task Panel (Visible only to Head) */}
                  {isProjectHead && (
                    <div className="card p-6" style={{ borderColor: `${openProject.project.color}55` }}>
                      <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 font-semibold">
                        {editingTaskId ? "Edit Project Task" : "Create Project Task Panel"}
                      </h4>
                      <form onSubmit={saveProjectTask} className="space-y-4">
                        <div className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
                          <input className="form-input w-full" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} required />
                          <select className="form-select" value={taskForm.category} onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))} required>
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <textarea className="form-textarea w-full" rows={3} placeholder="Task description" value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Priority</p>
                            <select className="form-select w-full" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} required>
                              <option value="">Select Priority</option>
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Status</p>
                            <select className="form-select w-full" value={taskForm.status} onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))} required>
                              <option value="">Select Status</option>
                              <option value="todo">Todo</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Assignee</p>
                            <select className="form-select w-full" value={taskForm.assignedTo} onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))} required>
                              <option value="">Select Member</option>
                              {acceptedMembers.filter(m => m.role !== "viewer").map((member) => (
                                <option key={member.user?._id || member.email} value={member.user?._id || ""}>
                                  {member.user?.fullName || member.email}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Deadline</p>
                            <input type="datetime-local" className="form-input w-full" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} required />
                          </div>
                        </div>

                        {/* Optional scheduling card */}
                        <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 py-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">Optional Scheduling & Estimates</p>
                              <p className="text-xs text-[var(--text-muted)] mt-1">Add planned work date or duration details only where necessary.</p>
                            </div>
                            <button type="button" className="btn btn-secondary !text-xs" onClick={() => setShowTaskScheduling((prev) => !prev)}>
                              {showTaskScheduling ? "Hide Optional Scheduling" : "Add Optional Scheduling"}
                            </button>
                          </div>
                          {showTaskScheduling && (
                            <div className="equal-split-row relaxed mt-4" style={{ "--split-count": 2 }}>
                              <div className="space-y-1">
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Planning Date</p>
                                <input type="date" className="form-input w-full" value={taskForm.scheduledDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, scheduledDate: e.target.value }))} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Estimated Hours</p>
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

                        {/* Subtask composer */}
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)] mb-2 font-semibold">Subtasks</p>
                          <div className="space-y-2">
                            {(taskForm.subtasks || []).map((subtask, index) => (
                              <div key={`sub-${index}`} className="flex gap-2">
                                <input
                                  className="form-input w-full"
                                  value={subtask.title}
                                  onChange={(e) => {
                                    const next = [...taskForm.subtasks];
                                    next[index] = { ...next[index], title: e.target.value };
                                    setTaskForm((prev) => ({ ...prev, subtasks: next }));
                                  }}
                                  placeholder={`Subtask ${index + 1}`}
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => setTaskForm((prev) => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }))}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost mt-2"
                            onClick={() => {
                              const subs = taskForm.subtasks || [];
                              if (subs.length >= 20) return showToast("Maximum 20 subtasks allowed");
                              setTaskForm((prev) => ({ ...prev, subtasks: [...(prev.subtasks || []), { title: "", completed: false }] }));
                            }}
                          >
                            + Add Subtask
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end w-full">
                          {editingTaskId && <button type="button" className="btn btn-secondary" onClick={resetTaskComposer}>Cancel Edit</button>}
                          <button type="submit" className="btn btn-primary">{editingTaskId ? "Save Task" : "Create Task"}</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Section 5: All Tasks Panel */}
                  <div className="card p-6 border border-[var(--line-soft)]">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-[var(--text-primary)]">All Tasks Panel</h4>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Everyone can view project work, but permissions are restricted by roles.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(openProject.tasks || []).length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">No project tasks yet.</p>
                      ) : (
                        openProject.tasks.map((task) => {
                          const assignee = acceptedMembers.find((member) => member.user?._id === task.assignedTo);
                          const isAssignedMember = String(task.assignedTo || "") === String(userId);
                          const canCompleteTask = isAssignedMember;
                          const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                          const doneSubtasks = hasSubtasks ? task.subtasks.filter(s => s.completed).length : 0;
                          const subtasksPercent = hasSubtasks ? Math.round((doneSubtasks / task.subtasks.length) * 100) : 0;
                          const canToggleSubtasks = (isProjectHead || isAssignedMember) && !isViewer;

                          return (
                            <div key={task._id} className="rounded-xl border p-4 bg-[var(--surface)] shadow-sm" style={{ borderColor: `${openProject.project.color}33` }}>
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-semibold text-[var(--text-primary)] text-base">{task.title}</h5>
                                    <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold" style={{ background: `${openProject.project.color}14`, color: openProject.project.color }}>
                                      {task.category || "General"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-[var(--text-muted)] mt-2 whitespace-pre-wrap">{task.description || "No description"}</p>
                                  
                                  <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold text-[var(--text-muted)]">
                                    <span className="badge border px-2 py-0.5 rounded-full" style={{ borderColor: `${openProject.project.color}44`, color: openProject.project.color, background: `${openProject.project.color}14` }}>{task.priority}</span>
                                    <span className={`badge ${task.status === "completed" ? "badge-status-done" : task.status === "in_progress" ? "badge-status-in-progress" : "badge-status-todo"}`}>
                                      {task.status.replace("_", " ")}
                                    </span>
                                    <span>Deadline: {formatDeadline(task.dueDate)}</span>
                                    {task.scheduledDate && <span>Planned: {formatDate(task.scheduledDate)}</span>}
                                    {task.estimatedDuration && <span>Est: {task.estimatedDuration}h</span>}
                                    <span>Assignee: <span className="text-[var(--text-primary)]">{assignee?.user?.fullName || "Unassigned"}</span></span>
                                  </div>

                                  {hasSubtasks && (
                                    <div className="mt-4 pt-3 border-t border-dashed border-[var(--line-soft)] space-y-2">
                                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                                        <span>Subtasks Progress:</span>
                                        <span className="font-semibold text-[var(--text-primary)]">
                                          {doneSubtasks}/{task.subtasks.length} ({subtasksPercent}%)
                                        </span>
                                      </div>
                                      <div className="w-full bg-[var(--surface-subtle)] rounded-full h-1.5 overflow-hidden border border-[var(--line-soft)]">
                                        <div
                                          className="h-1.5 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${subtasksPercent}%`,
                                            background: openProject.project.color
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="space-y-1.5 mt-3 pl-2 border-l-2" style={{ borderColor: openProject.project.color }}>
                                        {task.subtasks.map((subtask) => (
                                          <div key={subtask._id} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line-soft)]">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${subtask.completed ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"}`}>
                                                {subtask.completed ? "Done" : "Todo"}
                                              </span>
                                              <span className={`truncate ${subtask.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                                                {subtask.title}
                                              </span>
                                            </div>
                                            {canToggleSubtasks ? (
                                              <button
                                                type="button"
                                                onClick={() => handleSubtaskToggle(task._id, subtask._id)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                                                  subtask.completed
                                                    ? "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]"
                                                    : "bg-[var(--surface)] text-[var(--brand-primary)] border-[var(--line-soft)] hover:bg-[var(--surface-subtle)]"
                                                }`}
                                              >
                                                {subtask.completed ? "Completed" : "Mark Complete"}
                                              </button>
                                            ) : (
                                              <span className={`text-[10px] font-bold ${subtask.completed ? "text-[#15803D]" : "text-[var(--text-muted)]"}`}>
                                                {subtask.completed ? "Completed" : "Pending"}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
                                  {isProjectHead && <button className="btn btn-secondary !text-xs !py-1.5 !px-2.5" onClick={() => beginTaskEdit(task)}>Edit</button>}
                                  {canCompleteTask && task.status !== "completed" && !isViewer && (
                                    <button className="btn btn-secondary !text-xs !py-1.5 !px-2.5" onClick={() => completeTask(task._id)}>Mark Complete</button>
                                  )}
                                  <button className="btn btn-secondary !text-xs !py-1.5 !px-2.5" onClick={() => {
                                    setSelectedTaskId(task._id);
                                    setReplyTarget(null);
                                  }}>
                                    Comment
                                  </button>
                                  {isProjectHead && <button className="btn btn-accent !text-xs !py-1.5 !px-2.5" onClick={() => deleteTask(task._id)}>Delete</button>}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Invite & Members list & Common comments section */}
                <div className="space-y-6">
                  
                  {/* Section 2: Invite Members Section */}
                  {isProjectHead && (
                    <div className="card p-6 border border-[var(--line-soft)]" style={{ borderColor: `${openProject.project.color}55` }}>
                      <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Invite Members Section</h4>
                      <p className="text-xs text-[var(--text-muted)] mb-3">Add collaborators by their email and assign their role.</p>
                      <form onSubmit={sendInvite} className="flex flex-col gap-3">
                        <input
                          type="hidden"
                          value={invite.projectId = openProject.project._id}
                        />
                        <input
                          className="form-input"
                          type="email"
                          placeholder="Collaborator email"
                          value={invite.email}
                          onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value, projectId: openProject.project._id }))}
                          required
                        />
                        <select
                          className="form-select"
                          value={invite.role}
                          onChange={(e) => setInvite((prev) => ({ ...prev, role: e.target.value }))}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button className="btn btn-primary w-full" type="submit">Invite</button>
                      </form>
                    </div>
                  )}

                  {/* Section 3: Members List Section */}
                  <div className="card p-6 border border-[var(--line-soft)]">
                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Members List Section</h4>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-[var(--line-soft)] p-3 flex items-center justify-between bg-[var(--surface-subtle)]">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{openProject.project.owner?.fullName || openProject.project.owner?.email}</p>
                          <p className="text-xs text-[var(--text-muted)]">{openProject.project.owner?.email}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--brand-primary)] text-white">
                          Head
                        </span>
                      </div>
                      
                      {acceptedMembers.filter(m => m.user?._id !== openProject.project.owner?._id).map((member, index) => (
                        <div key={`${member.email}-${index}`} className="rounded-lg border border-[var(--line-soft)] p-3 flex items-center justify-between bg-[var(--surface)]">
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{member.user?.fullName || member.email}</p>
                            <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                          </div>
                          <span className="badge border px-2.5 py-1 rounded-full uppercase text-xs font-semibold" style={{
                            borderColor: member.role === "viewer" ? "var(--brand-primary)" : "#FED7AA",
                            color: member.role === "viewer" ? "var(--brand-primary)" : "#C2410C",
                            background: member.role === "viewer" ? "var(--surface-subtle)" : "#FFF7ED"
                          }}>
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 6: Project Comment Section */}
                  <div className="card p-6 border border-[var(--line-soft)]">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-[var(--text-primary)]">Project Comment Section</h4>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Suggestions, queries, discussions, and recommendations for project tasks.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="max-h-96 overflow-y-auto space-y-3 p-1">
                        {threadedComments.length === 0 ? (
                          <p className="text-sm text-[var(--text-muted)]">No comments yet.</p>
                        ) : (
                          threadedComments.map((comment) => (
                            <CommentThread key={comment._id} comment={comment} onReply={(tgt) => {
                              setReplyTarget(tgt);
                              setSelectedTaskId(tgt.task?._id || tgt.task || "");
                            }} />
                          ))
                        )}
                      </div>

                      <form onSubmit={submitComment} className="space-y-3 pt-3 border-t border-[var(--line-soft)]">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Which task the comment belongs to</p>
                            <select
                              className="form-select w-full"
                              value={selectedTaskId}
                              onChange={(e) => setSelectedTaskId(e.target.value)}
                              required
                            >
                              <option value="">Select Task</option>
                              {(openProject.tasks || []).map((t) => (
                                <option key={t._id} value={t._id}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                          {replyTarget && (
                            <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--text-muted)] flex items-center justify-between gap-2 mt-auto">
                              <span>Replying to {replyTarget.user?.fullName || "User"}</span>
                              <button type="button" className="text-[var(--brand-primary)] font-semibold" onClick={() => setReplyTarget(null)}>
                                Clear
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Comment content</p>
                          <textarea className="form-textarea w-full" rows={3} placeholder="Ask a question or leave a recommendation..." value={commentMessage} onChange={(e) => setCommentMessage(e.target.value)} required />
                        </div>
                        <button className="btn btn-primary" type="submit">Post Comment</button>
                      </form>
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
