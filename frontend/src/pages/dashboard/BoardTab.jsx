import React, { useEffect, useMemo, useState } from "react";
import { FiClock, FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

const columns = [
  { key: "todo", title: "Todo" },
  { key: "in_progress", title: "In Progress" },
  { key: "completed", title: "Completed" },
];

function dueText(task) {
  if (!task.dueDate) return "No due date";
  const d = new Date(task.dueDate);
  return d.toLocaleDateString();
}

export default function BoardTab() {
  const { showToast, refreshDashboard } = useDashboardWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragTaskId, setDragTaskId] = useState(null);

  const fetchBoardTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/tasks");
      setTasks(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardTasks();
  }, []);

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
      await Promise.all([fetchBoardTasks(), refreshDashboard()]);
      showToast("Task moved");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to move task");
    } finally {
      setDragTaskId(null);
    }
  };

  const quickDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      await Promise.all([fetchBoardTasks(), refreshDashboard()]);
      showToast("Task deleted");
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed");
    }
  };

  const quickEdit = async (task) => {
    const title = window.prompt("Edit task title", task.title);
    if (!title || title.trim().length < 3) return;
    try {
      await api.put(`/tasks/${task._id}`, { ...task, title: title.trim() });
      await fetchBoardTasks();
      showToast("Task updated");
    } catch (err) {
      showToast(err?.response?.data?.message || "Update failed");
    }
  };

  if (loading) return <div className="card p-6 text-[#5B9EA8]">Loading board...</div>;

  return (
    <div className="space-y-4">
      <section className="card p-6">
        <h2 className="text-xl font-semibold text-[#082F38]">Kanban Board</h2>
        <p className="text-sm text-[#5B9EA8] mt-1">Drag tasks between columns to update workflow status.</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div
            key={column.key}
            className="card p-4 min-h-[460px] bg-[#F8FCFD]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#082F38]">{column.title}</h3>
              <span className="text-xs text-[#5B9EA8]">{grouped[column.key].length} tasks • {completionPercent(column.key)}%</span>
            </div>

            <div className="space-y-3">
              {grouped[column.key].map((task) => {
                const subtasks = task.subtasks || [];
                const done = subtasks.filter((s) => s.completed).length;
                return (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={() => setDragTaskId(task._id)}
                    className="bg-white border border-[#C4E9ED]/60 rounded-xl p-3 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#082F38]">{task.title}</h4>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#FFF7ED] text-[#C2410C] uppercase">{task.priority}</span>
                    </div>
                    <p className="text-xs text-[#5B9EA8] mt-1">{task.description || "No description"}</p>
                    <div className="text-xs text-[#5B9EA8] mt-2 flex items-center gap-1"><FiClock /> {dueText(task)}</div>
                    <div className="text-xs text-[#5B9EA8] mt-1">Subtasks: {done}/{subtasks.length}</div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn btn-secondary !text-xs !px-2 !py-1" onClick={() => quickEdit(task)}><FiEdit2 /></button>
                      <button className="btn btn-secondary !text-xs !px-2 !py-1" onClick={() => quickDelete(task._id)}><FiTrash2 /></button>
                    </div>
                  </div>
                );
              })}

              {grouped[column.key].length === 0 && (
                <div className="border border-dashed border-[#C4E9ED] rounded-lg p-4 text-xs text-[#5B9EA8] text-center">
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
