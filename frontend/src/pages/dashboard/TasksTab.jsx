import React, { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";
import BoardTab from "./BoardTab";
import CalendarTab from "./CalendarTab";

const initialTaskForm = {
  title: "",
  description: "",
  category: "",
  priority: "",
  status: "",
  dueDate: "",
  scheduledDate: "",
  estimatedDuration: "",
  projectId: "",
  subtasks: [],
};

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

export default function TasksTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = (searchParams.get("view") || "list").toLowerCase();
  const isListView = currentView === "list";
  const { taskState, setTaskState, showToast, refreshDashboard } = useDashboardWorkspace();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState({});
  const [projects, setProjects] = useState([]);

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
  const [debouncedSearch, setDebouncedSearch] = useState(taskState.search || "");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch((taskState.search || "").trim()), 300);
    return () => clearTimeout(timer);
  }, [taskState.search]);

  const fetchTasks = async () => {
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

      setTaskState((prev) => ({ ...prev, tasks: response.data.data || [] }));
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setTaskState((prev) => ({ ...prev, tasksLoading: false }));
    }
  };

  useEffect(() => {
    if (isListView) fetchTasks();
  }, [debouncedSearch, taskState.statusFilter, taskState.priorityFilter, taskState.dueFilter, taskState.completedFilter, taskState.sortBy, isListView]);

  useEffect(() => {
    if (!isListView) {
      (async () => {
        try {
          setTaskState((prev) => ({ ...prev, tasksLoading: true }));
          const { data } = await api.get("/tasks");
          setTaskState((prev) => ({ ...prev, tasks: data.data || [] }));
        } catch (err) {
          showToast(err?.response?.data?.message || "Failed to load tasks");
        } finally {
          setTaskState((prev) => ({ ...prev, tasksLoading: false }));
        }
      })();
    }
  }, [isListView]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskForm(initialTaskForm);
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "",
      priority: task.priority || "",
      status: task.status || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate).toISOString().slice(0, 10) : "",
      estimatedDuration: task.estimatedDuration ?? "",
      projectId: task.projectId || "",
      subtasks: (task.subtasks || []).map((s) => ({ title: s.title, completed: s.completed })),
    });
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
        projectId: taskForm.projectId || null,
      };
      if (!editingTask && (!taskForm.priority || !taskForm.status)) {
        return showToast("Please select task priority and status.");
      }
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        showToast("Task updated");
      } else {
        await api.post("/tasks", payload);
        showToast("Task created");
      }
      setShowTaskModal(false);
      setTaskForm(initialTaskForm);
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
        <div className="mb-4 flex flex-wrap gap-2">
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

        <h2 className="text-xl font-semibold text-[#082F38] mb-2">Tasks Workspace</h2>
        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <FiSearch className="absolute left-3 top-3.5 text-[#5B9EA8]" />
            <input
              className="form-input w-full !pl-10"
              placeholder="Search title, description, subtasks..."
              value={taskState.search}
              onChange={(e) => setTaskState((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select className="form-select" value={taskState.statusFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, statusFilter: e.target.value }))}>
            <option value="" disabled>Filter Status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select className="form-select" value={taskState.priorityFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, priorityFilter: e.target.value }))}>
            <option value="" disabled>Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="form-select" value={taskState.dueFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, dueFilter: e.target.value }))}>
            <option value="" disabled>Select Due Date</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
        <div className="mt-3 grid md:grid-cols-4 gap-3">
          <select className="form-select" value={taskState.completedFilter} onChange={(e) => setTaskState((prev) => ({ ...prev, completedFilter: e.target.value }))}>
            <option value="" disabled>Completion Filter</option>
            <option value="true">Completed Only</option>
            <option value="false">Pending Only</option>
          </select>
          <select className="form-select" value={taskState.sortBy} onChange={(e) => setTaskState((prev) => ({ ...prev, sortBy: e.target.value }))}>
            <option value="" disabled>Sort By</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priority">Priority</option>
            <option value="deadline">Deadline</option>
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => setTaskState((prev) => ({ ...prev, search: "", statusFilter: "", priorityFilter: "", dueFilter: "", completedFilter: "", sortBy: "" }))}
          >
            Reset Controls
          </button>
          <button className="btn btn-primary flex items-center justify-center gap-2" onClick={openCreateModal}><FiPlus /> Create Task</button>
        </div>
      </section>

      {currentView === "list" && <section className="card p-6">
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
              const expanded = !!expandedTaskIds[task._id];
              const dueLabel = getDueLabel(task.dueDate, task.status);
              const projectColor = projects.find((p) => p._id === task.projectId)?.color || null;
              return (
                <div key={task._id} className="border rounded-xl p-4 bg-white" style={{ borderColor: projectColor || "#C4E9ED80" }}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold" style={{ color: projectColor || "#082F38" }}>{task.title}</h4>
                      <p className="text-sm text-[#5B9EA8] mt-1">{task.description || "No description"}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`badge ${task.status === "completed" ? "badge-status-done" : task.status === "in_progress" ? "badge-status-in-progress" : "badge-status-todo"}`}
                          style={projectColor ? { borderColor: projectColor, color: projectColor } : undefined}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span className="badge badge-status-due-soon">{task.priority}</span>
                        <span className={`text-xs flex items-center gap-1 ${dueLabel === "Overdue" ? "text-[#DC2626] font-semibold" : "text-[#5B9EA8]"}`}><FiClock /> {dueLabel}</span>
                        <span className="text-xs font-medium" style={{ color: projectColor || "#4F46E5" }}>{task.category || "General"}</span>
                        <span className="text-xs text-[#5B9EA8]">{doneSubtasks}/{subtasks.length} subtasks</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary" onClick={() => openEditModal(task)}><FiEdit2 /></button>
                      <button className="btn btn-secondary" onClick={() => setDeleteTarget(task)}><FiTrash2 /></button>
                      {task.status !== "completed" && <button className="btn btn-primary" onClick={() => handleMarkComplete(task)}>Mark Complete</button>}
                      <button className="btn btn-ghost" onClick={() => setExpandedTaskIds((prev) => ({ ...prev, [task._id]: !prev[task._id] }))}>{expanded ? <FiChevronUp /> : <FiChevronDown />}</button>
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-4 border-t border-[#E2F4F6] pt-3 space-y-2">
                      {subtasks.length === 0 ? (
                        <p className="text-xs text-[#5B9EA8]">No subtasks</p>
                      ) : (
                        subtasks.map((subtask) => (
                          <label key={subtask._id} className="flex items-center gap-2 text-sm text-[#082F38]">
                            <input type="checkbox" checked={subtask.completed} onChange={() => handleSubtaskToggle(task._id, subtask._id)} />
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
      </section>}

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
          <div className="bg-[var(--surface)] rounded-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto border border-[var(--line-soft)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{editingTask ? "Edit Task" : "Create Task"}</h3>
            <form onSubmit={handleTaskSubmit} className="space-y-3">
              <input className="form-input w-full" placeholder="Title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} required />
              <textarea className="form-textarea w-full" rows={3} placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))} />
              <div className="grid md:grid-cols-4 gap-3">
                <select className="form-select" value={taskForm.category} onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value }))}>
                  <option value="" disabled>Select Category</option>
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Personal">Personal</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Custom">Custom</option>
                </select>
                <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} required>
                  <option value="" disabled>Select Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select className="form-select" value={taskForm.status} onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))} required>
                  <option value="" disabled>Select Status</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8]">Deadline</p>
                  <input type="date" className="form-input" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8]">Scheduled Date (Optional)</p>
                  <input
                    type="date"
                    className="form-input"
                    value={taskForm.scheduledDate}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5B9EA8]">Estimated Duration (Hours)</p>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Estimated duration (hours)"
                    value={taskForm.estimatedDuration}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, estimatedDuration: e.target.value }))}
                  />
                </div>
              </div>
              <select className="form-select w-full" value={taskForm.projectId} onChange={(e) => setTaskForm((prev) => ({ ...prev, projectId: e.target.value }))}>
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>{project.title}</option>
                ))}
              </select>
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
                      <button type="button" className="btn btn-secondary" onClick={() => setTaskForm((prev) => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }))}>Remove</button>
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
