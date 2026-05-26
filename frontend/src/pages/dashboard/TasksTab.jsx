import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEdit2,
  FiFolder,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";
import BoardTab from "./BoardTab";
import CalendarTab from "./CalendarTab";

const initialTaskForm = {
  taskScope: "self",
  title: "",
  description: "",
  category: "Personal",
  priority: "medium",
  status: "todo",
  dueDate: "",
  scheduledDate: "",
  estimatedDuration: "",
  projectId: "",
  assignedTo: "",
  subtasks: [],
};

const categories = ["Work", "Study", "Personal", "Meeting", "Development", "Design", "Operations"];

function getDueLabel(dueDate, status) {
  if (!dueDate) return "No deadline";
  const now = new Date();
  const d = new Date(dueDate);
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.ceil((target - today) / dayMs);
  if (status !== "completed" && d < now) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `${diff} days left`;
  return "Overdue";
}

function enrichTask(task, projectMap) {
  const project = task.projectId ? projectMap.get(String(task.projectId)) : null;
  return {
    ...task,
    projectColor: project?.color || null,
    projectTitle: project?.title || "",
  };
}

export default function TasksTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = (searchParams.get("view") || "list").toLowerCase();
  const isListView = currentView === "list";
  const { taskState, setTaskState, showToast, refreshDashboard, dashboardData } = useDashboardWorkspace();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState({});
  const [projects, setProjects] = useState([]);
  const [showSchedulingFields, setShowSchedulingFields] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(taskState.search || "");
  const userId = dashboardData?.user?.id;

  const projectMap = useMemo(() => {
    const map = new Map();
    for (const project of projects) {
      map.set(String(project._id), project);
    }
    return map;
  }, [projects]);

  const ownedProjects = useMemo(
    () =>
      projects.filter((project) => {
        const ownerId = typeof project.owner === "string" ? project.owner : project.owner?._id;
        return ownerId === userId;
      }),
    [projects, userId]
  );

  const selectedOwnedProject = ownedProjects.find((project) => project._id === taskForm.projectId);
  const projectMembers = (selectedOwnedProject?.members || []).filter(
    (member) => member.status === "accepted" && member.user?._id
  );

  useEffect(() => {
    if (!["list", "board", "calendar"].includes(currentView)) {
      setSearchParams({ view: "list" });
    }
  }, [currentView, setSearchParams]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/projects");
        setProjects(data.data || []);
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch((taskState.search || "").trim()), 300);
    return () => clearTimeout(timer);
  }, [taskState.search]);

  const applyTasks = useCallback((incoming) => {
    setTaskState((prev) => ({
      ...prev,
      tasks: (incoming || []).map((task) => enrichTask(task, projectMap)),
    }));
  }, [projectMap, setTaskState]);

  const fetchTasks = useCallback(async () => {
    try {
      setTaskState((prev) => ({ ...prev, tasksLoading: true }));
      let response;
      if (debouncedSearch) {
        response = await api.get("/tasks/search", { params: { q: debouncedSearch } });
      } else if (taskState.statusFilter || taskState.priorityFilter || taskState.dueFilter || taskState.completedFilter) {
        response = await api.get("/tasks/filter", {
          params: {
            status: taskState.statusFilter || undefined,
            priority: taskState.priorityFilter || undefined,
            due: taskState.dueFilter || undefined,
            completed: taskState.completedFilter || undefined,
          },
        });
      } else if (taskState.sortBy) {
        const mapping = {
          newest: { by: "createdAt", order: "desc" },
          oldest: { by: "createdAt", order: "asc" },
          priority: { by: "priority", order: "desc" },
          deadline: { by: "dueDate", order: "asc" },
        };
        response = await api.get("/tasks/sort", { params: mapping[taskState.sortBy] });
      } else {
        response = await api.get("/tasks");
      }

      applyTasks(response.data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setTaskState((prev) => ({ ...prev, tasksLoading: false }));
    }
  }, [
    applyTasks,
    debouncedSearch,
    setTaskState,
    showToast,
    taskState.completedFilter,
    taskState.dueFilter,
    taskState.priorityFilter,
    taskState.sortBy,
    taskState.statusFilter,
  ]);

  useEffect(() => {
    if (isListView) fetchTasks();
  }, [fetchTasks, isListView]);

  useEffect(() => {
    if (!isListView) {
      (async () => {
        try {
          setTaskState((prev) => ({ ...prev, tasksLoading: true }));
          const { data } = await api.get("/tasks");
          applyTasks(data.data || []);
        } catch (err) {
          showToast(err?.response?.data?.message || "Failed to load tasks");
        } finally {
          setTaskState((prev) => ({ ...prev, tasksLoading: false }));
        }
      })();
    }
  }, [applyTasks, isListView, setTaskState, showToast]);

  const resetTaskComposer = () => {
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setShowSchedulingFields(false);
  };

  const openCreateModal = () => {
    resetTaskComposer();
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      taskScope: task.projectId ? "project" : "self",
      title: task.title || "",
      description: task.description || "",
      category: task.category || "Personal",
      priority: task.priority || "medium",
      status: task.status || "todo",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().slice(0, 10) : "",
      estimatedDuration: task.estimatedDuration ?? "",
      projectId: task.projectId || "",
      assignedTo: task.assignedTo || "",
      subtasks: (task.subtasks || []).map((subtask) => ({
        title: subtask.title,
        completed: subtask.completed,
      })),
    });
    setShowSchedulingFields(Boolean(task.scheduledDate || task.estimatedDuration));
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        estimatedDuration:
          taskForm.estimatedDuration === "" || taskForm.estimatedDuration === null
            ? null
            : Number(taskForm.estimatedDuration),
        projectId: taskForm.taskScope === "project" ? taskForm.projectId || null : null,
        assignedTo: taskForm.taskScope === "project" ? taskForm.assignedTo || null : null,
        scheduledDate: showSchedulingFields ? taskForm.scheduledDate || null : null,
      };

      if (taskForm.taskScope === "project" && !taskForm.projectId) {
        return showToast("Choose one of your own projects for project work.");
      }
      if (taskForm.taskScope === "project" && !taskForm.assignedTo) {
        return showToast("Assign project work to a specific collaborator.");
      }
      if (!taskForm.category) {
        return showToast("Choose a category so this work can be analyzed later.");
      }

      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        showToast("Task updated");
      } else {
        await api.post("/tasks", payload);
        showToast(taskForm.taskScope === "project" ? "Project task created" : "Personal task created");
      }

      setShowTaskModal(false);
      resetTaskComposer();
      await Promise.all([fetchTasks(), refreshDashboard()]);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save task");
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tasks/${deleteTarget._id}`);
      setDeleteTarget(null);
      showToast("Task deleted");
      await Promise.all([fetchTasks(), refreshDashboard()]);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete task");
    }
  };

  const handleMarkComplete = async (task) => {
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: "completed" });
      showToast("Task marked complete");
      await Promise.all([fetchTasks(), refreshDashboard()]);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleSubtaskToggle = async (taskId, subtaskId) => {
    try {
      await api.patch(`/tasks/${taskId}/subtasks`, { subtaskId });
      await fetchTasks();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update subtask");
    }
  };

  const tasks = taskState.tasks || [];
  const tasksLoading = taskState.tasksLoading;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#5B9EA8]">Workspace</p>
            <h2 className="text-xl font-semibold text-[#082F38] mt-1">Tasks Workspace</h2>
            <p className="text-sm text-[#5B9EA8] mt-1">
              Personal tasks stay private to you. Project tasks appear here only when they are assigned to you.
            </p>
          </div>
          <button className="btn btn-primary flex items-center justify-center gap-2" onClick={openCreateModal}>
            <FiPlus /> Create Task
          </button>
        </div>

        <div className="equal-split-row compact mt-5" style={{ "--split-count": 3, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              currentView === "list" ? "bg-[#0E7490] text-white border-[#0E7490]" : "bg-white text-[#0E7490] border-[#C4E9ED] hover:bg-[#E2F4F6]"
            }`}
            onClick={() => setSearchParams({ view: "list" })}
          >
            List View
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              currentView === "board" ? "bg-[#0E7490] text-white border-[#0E7490]" : "bg-white text-[#0E7490] border-[#C4E9ED] hover:bg-[#E2F4F6]"
            }`}
            onClick={() => setSearchParams({ view: "board" })}
          >
            Kanban Board
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              currentView === "calendar" ? "bg-[#0E7490] text-white border-[#0E7490]" : "bg-white text-[#0E7490] border-[#C4E9ED] hover:bg-[#E2F4F6]"
            }`}
            onClick={() => setSearchParams({ view: "calendar" })}
          >
            Calendar
          </button>
        </div>

        <div className="equal-split-row relaxed mt-4" style={{ "--split-count": 4 }}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-[#5B9EA8]" />
            <input
              className="form-input w-full !pl-10"
              placeholder="Search title, notes, subtasks, or category"
              value={taskState.search}
              onChange={(e) => setTaskState((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select className="form-select" value={taskState.statusFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, statusFilter: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select className="form-select" value={taskState.priorityFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, priorityFilter: e.target.value }))}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="form-select" value={taskState.dueFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, dueFilter: e.target.value }))}>
            <option value="">Deadline Window</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        <div className="equal-split-row relaxed mt-3" style={{ "--split-count": 4 }}>
          <select className="form-select" value={taskState.completedFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, completedFilter: e.target.value }))}>
            <option value="">Completion Scope</option>
            <option value="true">Completed Only</option>
            <option value="false">Open Work Only</option>
          </select>
          <select className="form-select" value={taskState.sortBy} onChange={(e) => setTaskState((prev) => ({ ...prev, sortBy: e.target.value }))}>
            <option value="">Sort Order</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
            <option value="deadline">Deadline</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={() =>
              setTaskState((prev) => ({
                ...prev,
                search: "",
                statusFilter: "",
                priorityFilter: "",
                dueFilter: "",
                completedFilter: "",
                sortBy: "",
              }))
            }
          >
            Reset Controls
          </button>
          <div className="rounded-xl border border-[#E2F4F6] bg-[#F8FCFD] px-4 py-3 text-sm text-[#5B9EA8]">
            Project work here is limited to tasks assigned directly to you.
          </div>
        </div>
      </section>

      {currentView === "list" && (
        <section className="card p-6">
          <h3 className="text-xl font-semibold text-[#082F38] mb-4">Task List</h3>
          {tasksLoading ? (
            <p className="text-[#5B9EA8]">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#5B9EA8] mb-3">No tasks found for the selected criteria.</p>
              <button className="btn btn-secondary" onClick={openCreateModal}>Create your first task</button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const subtasks = task.subtasks || [];
                const doneSubtasks = subtasks.filter((s) => s.completed).length;
                const expanded = Boolean(expandedTaskIds[task._id]);
                const dueLabel = getDueLabel(task.dueDate, task.status);
                const projectColor = task.projectColor || "#0E7490";
                const isProjectTask = Boolean(task.projectId);
                const isOwnedProjectTask = isProjectTask && ownedProjects.some((project) => project._id === task.projectId);
                const canEditTask = !isProjectTask || isOwnedProjectTask;
                const canToggleSubtasks = canEditTask;

                return (
                  <div
                    key={task._id}
                    className="rounded-2xl border p-4 bg-white shadow-sm transition-all hover:shadow-md"
                    style={{ 
                      borderColor: isProjectTask ? `${projectColor}40` : "#C4E9ED80",
                      borderLeft: isProjectTask ? `5px solid ${projectColor}` : `5px solid #C4E9ED`
                    }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-[#082F38]">{task.title}</h4>
                          {isProjectTask ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                              style={{ background: `${projectColor}14`, color: projectColor }}
                            >
                              <FiFolder /> {task.projectTitle || "Project Task"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#E2F4F6] text-[#0E7490]">
                              <FiUser /> Personal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#5B9EA8] mt-2">{task.description || "No description"}</p>

                        <div className="equal-split-row compact mt-4" style={{ "--split-count": 5 }}>
                          <span className={`badge ${task.status === "completed" ? "badge-status-done" : task.status === "in_progress" ? "badge-status-in-progress" : "badge-status-todo"}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span
                            className="badge border"
                            style={{
                              color: isProjectTask ? projectColor : "#C2410C",
                              borderColor: isProjectTask ? `${projectColor}44` : "#FED7AA",
                              background: isProjectTask ? `${projectColor}14` : "#FFF7ED",
                            }}
                          >
                            {task.priority}
                          </span>
                          <span className={`text-xs flex items-center gap-1 ${dueLabel === "Overdue" ? "text-[#DC2626] font-semibold" : "text-[#5B9EA8]"}`}>
                            <FiClock /> {dueLabel}
                          </span>
                          <span className="text-xs text-[#5B9EA8]">{task.category || "Uncategorized"}</span>
                          <span className="text-xs text-[#5B9EA8]">{doneSubtasks}/{subtasks.length} subtasks</span>
                        </div>
                      </div>

                      <div className="equal-split-row compact w-full xl:w-[320px]" style={{ "--split-count": 4 }}>
                        {canEditTask ? (
                          <button className="btn btn-secondary" onClick={() => openEditModal(task)}>
                            <FiEdit2 />
                          </button>
                        ) : (
                          <div className="rounded-lg border border-[#E2F4F6] bg-[#F8FCFD] px-3 py-2 text-xs text-[#5B9EA8] text-center">
                            View only
                          </div>
                        )}
                        {canEditTask ? (
                          <button className="btn btn-secondary" onClick={() => setDeleteTarget(task)}>
                            <FiTrash2 />
                          </button>
                        ) : (
                          <div className="rounded-lg border border-[#E2F4F6] bg-[#F8FCFD] px-3 py-2 text-xs text-[#5B9EA8] text-center">
                            Protected
                          </div>
                        )}
                        {task.status !== "completed" ? (
                          <button className="btn btn-primary" onClick={() => handleMarkComplete(task)}>
                            <FiCheckCircle /> Complete
                          </button>
                        ) : (
                          <div className="rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2 text-xs text-[#15803D] text-center font-medium">
                            Completed
                          </div>
                        )}
                        <button
                          className="btn btn-ghost"
                          onClick={() => setExpandedTaskIds((prev) => ({ ...prev, [task._id]: !prev[task._id] }))}
                        >
                          {expanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 border-t border-[#E2F4F6] pt-4 space-y-3">
                        <div className="equal-split-row compact" style={{ "--split-count": 3 }}>
                          <div className="rounded-xl bg-[#F8FCFD] px-4 py-3 text-sm text-[#5B9EA8]">
                            <span className="block text-xs uppercase tracking-wide mb-1">Deadline</span>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}
                          </div>
                          <div className="rounded-xl bg-[#F8FCFD] px-4 py-3 text-sm text-[#5B9EA8]">
                            <span className="block text-xs uppercase tracking-wide mb-1">Planning Date</span>
                            {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : "Not scheduled"}
                          </div>
                          <div className="rounded-xl bg-[#F8FCFD] px-4 py-3 text-sm text-[#5B9EA8]">
                            <span className="block text-xs uppercase tracking-wide mb-1">Estimated Hours</span>
                            {task.estimatedDuration ?? "Not set"}
                          </div>
                        </div>

                        {subtasks.length === 0 ? (
                          <p className="text-xs text-[#5B9EA8]">No subtasks</p>
                        ) : (
                          subtasks.map((subtask) => (
                            <label key={subtask._id} className="flex items-center gap-2 text-sm text-[#082F38]">
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                disabled={!canToggleSubtasks}
                                onChange={() => handleSubtaskToggle(task._id, subtask._id)}
                              />
                              <span className={subtask.completed ? "line-through text-[#5B9EA8]" : ""}>{subtask.title}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {currentView === "board" && (
        <BoardTab
          tasks={tasks}
          loading={tasksLoading}
          showToast={showToast}
          onRefresh={async () => {
            await Promise.all([fetchTasks(), refreshDashboard()]);
          }}
          onEditTask={openEditModal}
        />
      )}

      {currentView === "calendar" && (
        <CalendarTab
          tasks={tasks}
          loading={tasksLoading}
          showToast={showToast}
          onRefresh={async () => {
            await Promise.all([fetchTasks(), refreshDashboard()]);
          }}
          onEditTask={openEditModal}
        />
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-[var(--surface)] rounded-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto border border-[var(--line-soft)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {editingTask ? "Edit Task" : "Create Task"}
            </h3>

            <form onSubmit={handleTaskSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`rounded-xl border px-4 py-4 text-left transition-colors ${taskForm.taskScope === "self" ? "border-[#0E7490] bg-[#F0F9FA]" : "border-[var(--line-soft)] bg-[var(--surface)]"}`}
                  onClick={() => setTaskForm((prev) => ({ ...prev, taskScope: "self", projectId: "", assignedTo: "" }))}
                >
                  <p className="font-semibold text-[#082F38]">Personal Task</p>
                  <p className="text-xs text-[#5B9EA8] mt-1">Private, self-managed work that belongs only to your personal workflow.</p>
                </button>
                <button
                  type="button"
                  className={`rounded-xl border px-4 py-4 text-left transition-colors ${taskForm.taskScope === "project" ? "border-[#0E7490] bg-[#F0F9FA]" : "border-[var(--line-soft)] bg-[var(--surface)]"}`}
                  onClick={() => setTaskForm((prev) => ({ ...prev, taskScope: "project" }))}
                >
                  <p className="font-semibold text-[#082F38]">Project Task</p>
                  <p className="text-xs text-[#5B9EA8] mt-1">Collaborative work linked to one of your projects and assigned to a project member.</p>
                </button>
              </div>

              <div className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
                <input
                  className="form-input w-full"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
                <select
                  className="form-select"
                  value={taskForm.category}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))}
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <textarea
                className="form-textarea w-full"
                rows={3}
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              />

              {taskForm.taskScope === "project" && (
                <div className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Project</p>
                    <select
                      className="form-select"
                      value={taskForm.projectId}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, projectId: e.target.value, assignedTo: "" }))}
                      required
                    >
                      <option value="">Select Your Project</option>
                      {ownedProjects.map((project) => (
                        <option key={project._id} value={project._id}>{project.title}</option>
                      ))}
                    </select>
                    {ownedProjects.length === 0 && (
                      <p className="text-xs text-[#DC2626]">Create a project you own before adding project-based work here.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Assign To</p>
                    <select
                      className="form-select"
                      value={taskForm.assignedTo}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                      required
                    >
                      <option value="">Select Collaborator</option>
                      {projectMembers.map((member) => (
                        <option key={member.user?._id} value={member.user?._id}>
                          {member.role === "owner" ? `${member.user?.fullName || member.email} (Head)` : member.user?.fullName || member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="equal-split-row relaxed" style={{ "--split-count": 3 }}>
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
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Deadline</p>
                  <input type="date" className="form-input w-full" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                </div>
              </div>

              <div className="rounded-xl border border-[#E2F4F6] bg-[#F8FCFD] px-4 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#082F38]">Optional Scheduling & Estimates</p>
                    <p className="text-xs text-[#5B9EA8] mt-1">Add planned work date or duration details only where necessary.</p>
                  </div>
                  <button type="button" className="btn btn-secondary !text-xs" onClick={() => setShowSchedulingFields((prev) => !prev)}>
                    {showSchedulingFields ? "Hide Optional Scheduling" : "Add Optional Scheduling"}
                  </button>
                </div>

                {showSchedulingFields && (
                  <div className="equal-split-row relaxed mt-4" style={{ "--split-count": 2 }}>
                    <div className="space-y-1">
                      <p className="text-xs text-[#5B9EA8] uppercase tracking-wide">Planning Date</p>
                      <input
                        type="date"
                        className="form-input w-full"
                        value={taskForm.scheduledDate}
                        onChange={(e) => setTaskForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                      />
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

              <div>
                <p className="text-sm font-medium text-[#082F38] mb-2">Subtasks</p>
                <div className="space-y-2">
                  {taskForm.subtasks.map((subtask, index) => (
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
                    if (taskForm.subtasks.length >= 20) return showToast("Maximum 20 subtasks allowed");
                    setTaskForm((prev) => ({ ...prev, subtasks: [...prev.subtasks, { title: "", completed: false }] }));
                  }}
                >
                  + Add Subtask
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTask ? "Save Changes" : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-[var(--surface)] rounded-xl w-full max-w-md p-6 border border-[var(--line-soft)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Delete Task</h3>
            <p className="text-sm text-[#5B9EA8]">Are you sure you want to delete "{deleteTarget.title}"?</p>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleDeleteTask}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
