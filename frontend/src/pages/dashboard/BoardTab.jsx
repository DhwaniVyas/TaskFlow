import { useMemo, useState } from "react";
import { FiClock, FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../../api/client";

const columns = [
  { key: "todo", title: "Todo" },
  { key: "in_progress", title: "In Progress" },
  { key: "completed", title: "Completed" },
];

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

const priorityStyles = {
  low: { background: "var(--surface-subtle)", color: "var(--text-muted)", border: "var(--line-soft)" },
  medium: { background: "#FDF4E5", color: "#C07D3E", border: "#F6E5D0" },
  high: { background: "#FFF0ED", color: "#E35336", border: "#FADCD7" },
  urgent: { background: "#F0E5DF", color: "#A0522D", border: "#DFD0C7" },
};

export default function BoardTab({ tasks = [], loading = false, onRefresh, onEditTask, showToast }) {
  const [dragTaskId, setDragTaskId] = useState(null);

  const grouped = useMemo(() => {
    const map = { todo: [], in_progress: [], completed: [] };
    for (const task of tasks) {
      map[task.status]?.push(task);
    }
    return map;
  }, [tasks]);

  const completionPercent = (key) => {
    if (!tasks.length) return 0;
    return Math.round((grouped[key].length / tasks.length) * 100);
  };

  const handleDrop = async (nextStatus) => {
    if (!dragTaskId) return;
    try {
      await api.patch(`/tasks/${dragTaskId}/status`, { status: nextStatus });
      await onRefresh?.();
      showToast?.("Task moved");
    } catch (err) {
      showToast?.(err?.response?.data?.message || "Failed to move task");
    } finally {
      setDragTaskId(null);
    }
  };

  const quickDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      await onRefresh?.();
      showToast?.("Task deleted");
    } catch (err) {
      showToast?.(err?.response?.data?.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="card p-6 border border-[var(--line-soft)]">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="card p-6 border border-[var(--line-soft)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Kanban Board</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Drag tasks between columns to update workflow status.</p>
      </section>

      <section className="flex flex-row md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible pb-4 shrink-0">
        {columns.map((column) => (
          <div
            key={column.key}
            className="w-[85vw] sm:w-[340px] md:w-auto shrink-0 md:shrink card p-4 min-h-[460px] bg-[var(--surface-subtle)] border border-[var(--line-soft)] flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.key)}
          >
            <div className="flex items-center justify-between mb-3 border-b border-[var(--line-soft)] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{column.title}</h3>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {grouped[column.key].length} tasks | {completionPercent(column.key)}%
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {grouped[column.key].map((task) => {
                const subtasks = task.subtasks || [];
                const done = subtasks.filter((s) => s.completed).length;
                const projectColor = task.projectColor || "#A0522D";
                const isProjectTask = Boolean(task.projectId);
                const styleObj = priorityStyles[task.priority?.toLowerCase()] || priorityStyles.low;

                return (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={() => setDragTaskId(task._id)}
                    className="bg-[var(--surface)] border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
                    style={{ 
                      borderColor: isProjectTask ? `${projectColor}40` : "var(--line-soft)",
                      borderLeft: isProjectTask ? `4px solid ${projectColor}` : "4px solid var(--brand-primary)"
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{task.title}</h4>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded uppercase border font-semibold shrink-0"
                        style={{
                          background: isProjectTask ? `${projectColor}14` : styleObj.background,
                          color: isProjectTask ? projectColor : styleObj.color,
                          borderColor: isProjectTask ? `${projectColor}44` : styleObj.border,
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{task.description || "No description"}</p>
                    <div className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                      <FiClock /> {formatDeadline(task.dueDate)}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="text-xs text-[var(--text-muted)] font-medium">Subtasks: {done}/{subtasks.length}</div>
                      {isProjectTask && (
                        <span
                          className="text-[10px] px-2 py-1 rounded uppercase tracking-wide font-semibold"
                          style={{ background: `${projectColor}14`, color: projectColor }}
                        >
                          Project
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn btn-secondary !text-xs !px-2 !py-1" onClick={() => onEditTask?.(task)}>
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-secondary !text-xs !px-2 !py-1" onClick={() => quickDelete(task._id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                );
              })}

              {grouped[column.key].length === 0 && (
                <div className="border border-dashed border-[var(--line-soft)] rounded-lg p-4 text-xs text-[var(--text-muted)] text-center">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
