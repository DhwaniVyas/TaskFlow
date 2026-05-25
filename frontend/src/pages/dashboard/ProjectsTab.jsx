import React, { useEffect, useState } from "react";
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
  category: "",
  priority: "",
  status: "",
  dueDate: "",
  scheduledDate: "",
  assignedTo: "",
};

export default function ProjectsTab() {
  const { showToast } = useDashboardWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState(initialProject);
  const [invite, setInvite] = useState({ projectId: "", email: "", role: "member" });
  const [openProject, setOpenProject] = useState(null);
  const [taskForm, setTaskForm] = useState(initialProjectTask);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [comments, setComments] = useState([]);
  const [commentMessage, setCommentMessage] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/projects");
      setProjects(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

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
  }, [searchParams, setSearchParams]);

  const acceptedMembers = (openProject?.project?.members || []).filter((member) => member.status === "accepted");

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
      category: task.category || "",
      priority: task.priority || "",
      status: task.status || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().slice(0, 10) : "",
      assignedTo: task.assignedTo || "",
    });
  };

  const resetTaskComposer = () => {
    setEditingTaskId("");
    setTaskForm(initialProjectTask);
  };

  const saveProjectTask = async (e) => {
    e.preventDefault();
    if (!openProject?.project?._id) return;
    try {
      const payload = {
        ...taskForm,
        projectId: openProject.project._id,
        assignedTo: taskForm.assignedTo || null,
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
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update task status");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!selectedTaskId || !commentMessage.trim()) return;
    try {
      await api.post(`/tasks/${selectedTaskId}/comments`, { message: commentMessage.trim() });
      setCommentMessage("");
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
            <p className="text-sm text-[#5B9EA8] mt-1">Create projects, invite collaborators, assign work, and discuss tasks inside the same workspace.</p>
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
            const acceptedCount = (project.members || []).filter((member) => member.status === "accepted").length;
            const pendingCount = (project.members || []).filter((member) => member.status === "pending").length;
            return (
              <div key={project._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#082F38]">{project.title}</h3>
                    <p className="text-sm text-[#5B9EA8] mt-1">{project.description || "No description"}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded" style={{ background: `${project.color}20`, color: project.color }}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-xs text-[#5B9EA8]">
                  <p>Members: {acceptedCount} accepted | {pendingCount} pending</p>
                  <p>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</p>
                  <p>Deadline: {project.targetDate ? new Date(project.targetDate).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${project.progress || 0}%`, background: project.color }} />
                  </div>
                  <p className="text-xs text-[#5B9EA8] mt-2">Progress: {project.progress || 0}%</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-secondary !text-xs" onClick={() => fetchProjectDetails(project._id)}>Open</button>
                  <button className="btn btn-secondary !text-xs" onClick={() => openEditProject(project)}>Edit</button>
                  <button className="btn btn-secondary !text-xs" onClick={() => archiveProject(project._id)}>Archive</button>
                  <button className="btn btn-accent !text-xs" onClick={() => deleteProject(project._id)}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold text-[#082F38]">Invite Member</h3>
        <form onSubmit={sendInvite} className="grid md:grid-cols-4 gap-3 mt-3">
          <select className="form-select" value={invite.projectId} onChange={(e) => setInvite((prev) => ({ ...prev, projectId: e.target.value }))} required>
            <option value="">Select Project</option>
            {projects.map((project) => (
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
      </section>

      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-[var(--surface)] rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-[var(--line-soft)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{editingProject ? "Edit Project" : "Create Project"}</h3>
            <form onSubmit={saveProject} className="space-y-4">
              <input className="form-input w-full" placeholder="Project name" value={projectForm.title} onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))} required />
              <textarea className="form-textarea w-full" rows={4} placeholder="Project description" value={projectForm.description} onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))} />
              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8]">Project Color</p>
                  <input type="color" className="form-input h-[44px]" value={projectForm.color} onChange={(e) => setProjectForm((prev) => ({ ...prev, color: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8]">Start Date</p>
                  <input type="date" className="form-input" value={projectForm.startDate} onChange={(e) => setProjectForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8]">Deadline</p>
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
        <section className="space-y-4">
          <div className="card p-6" style={{ borderColor: openProject.project.color }}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-[#082F38]">{openProject.project.title}</h3>
                <p className="text-sm text-[#5B9EA8] mt-1">{openProject.project.description || "No description"}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#5B9EA8]">
                  <span>Start: {openProject.project.startDate ? new Date(openProject.project.startDate).toLocaleDateString() : "N/A"}</span>
                  <span>Deadline: {openProject.project.targetDate ? new Date(openProject.project.targetDate).toLocaleDateString() : "N/A"}</span>
                  <span>Accepted Members: {acceptedMembers.length}</span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setOpenProject(null)}>Close Workspace</button>
            </div>
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
            <div className="space-y-4">
              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[#082F38] mb-4">{editingTaskId ? "Edit Project Task" : "Create Project Task"}</h4>
                <form onSubmit={saveProjectTask} className="space-y-3">
                  <input className="form-input w-full" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} required />
                  <textarea className="form-textarea w-full" rows={3} placeholder="Task description" value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} />
                  <div className="grid md:grid-cols-4 gap-3">
                    <select className="form-select" value={taskForm.category} onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))} required>
                      <option value="">Select Category</option>
                      <option value="Work">Work</option>
                      <option value="Study">Study</option>
                      <option value="Personal">Personal</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} required>
                      <option value="">Select Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select className="form-select" value={taskForm.status} onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))} required>
                      <option value="">Select Status</option>
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
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-[#5B9EA8]">Deadline</p>
                      <input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[#5B9EA8]">Scheduled Date (Optional)</p>
                      <input type="date" className="form-input" value={taskForm.scheduledDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, scheduledDate: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    {editingTaskId && <button type="button" className="btn btn-secondary" onClick={resetTaskComposer}>Cancel Edit</button>}
                    <button type="submit" className="btn btn-primary">{editingTaskId ? "Save Task" : "Create Task"}</button>
                  </div>
                </form>
              </div>

              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[#082F38] mb-4">Project Tasks</h4>
                <div className="space-y-3">
                  {(openProject.tasks || []).length === 0 ? (
                    <p className="text-sm text-[#5B9EA8]">No project tasks yet.</p>
                  ) : (
                    openProject.tasks.map((task) => {
                      const assignee = acceptedMembers.find((member) => member.user?._id === task.assignedTo);
                      return (
                        <div key={task._id} className="rounded-xl border p-4 bg-white" style={{ borderColor: openProject.project.color }}>
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div>
                              <h5 className="font-semibold text-[#082F38]">{task.title}</h5>
                              <p className="text-sm text-[#5B9EA8] mt-1">{task.description || "No description"}</p>
                              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                <span className="badge badge-status-due-soon">{task.priority}</span>
                                <span className={`badge ${task.status === "completed" ? "badge-status-done" : task.status === "in_progress" ? "badge-status-in-progress" : "badge-status-todo"}`}>
                                  {task.status.replace("_", " ")}
                                </span>
                                <span style={{ color: openProject.project.color }}>{task.category || "General"}</span>
                                <span className="text-[#5B9EA8]">Deadline: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</span>
                                <span className="text-[#5B9EA8]">Assigned: {assignee?.user?.fullName || "Unassigned"}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button className="btn btn-secondary !text-xs" onClick={() => beginTaskEdit(task)}>Edit</button>
                              <button className="btn btn-secondary !text-xs" onClick={() => completeTask(task._id)}>Mark Complete</button>
                              <button className="btn btn-secondary !text-xs" onClick={() => {
                                setSelectedTaskId(task._id);
                                fetchComments(task._id);
                              }}>
                                Discuss
                              </button>
                              <button className="btn btn-accent !text-xs" onClick={() => deleteTask(task._id)}>Delete</button>
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
                  {(openProject.project.members || []).map((member, index) => (
                    <div key={`${member.email}-${index}`} className="rounded-lg border border-[#E2E8F0] p-3">
                      <p className="font-medium text-[#082F38]">{member.user?.fullName || member.email}</p>
                      <p className="text-xs text-[#5B9EA8]">{member.role} | {member.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h4 className="text-lg font-semibold text-[#082F38] mb-4">Task Discussion</h4>
                {!selectedTaskId ? (
                  <p className="text-sm text-[#5B9EA8]">Choose a project task to start the conversation.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {comments.length === 0 ? (
                        <p className="text-sm text-[#5B9EA8]">No comments yet.</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment._id} className="rounded-lg border border-[#E2E8F0] p-3">
                            <p className="text-sm text-[#082F38]">{comment.message}</p>
                            <p className="text-xs text-[#5B9EA8] mt-1">
                              {comment.user?.fullName || "User"} | {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={submitComment} className="space-y-2">
                      <textarea className="form-textarea w-full" rows={3} placeholder="Ask a question or leave a recommendation..." value={commentMessage} onChange={(e) => setCommentMessage(e.target.value)} />
                      <button className="btn btn-primary" type="submit">Post Comment</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
