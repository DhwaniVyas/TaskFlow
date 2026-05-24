import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

const views = ["month", "week", "day", "agenda"];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dueBadge(task) {
  const now = new Date();
  const d = new Date(task.dueDate || task.scheduledDate);
  if (!task.dueDate && !task.scheduledDate) return "No date";
  if (task.status !== "completed" && d < now) return "Overdue";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target - today) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 3) return "Due Soon";
  return "Upcoming";
}

export default function CalendarTab() {
  const { showToast, refreshDashboard } = useDashboardWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [dragTaskId, setDragTaskId] = useState(null);

  const fetchCalendarTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/tasks");
      setTasks(data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [cursor]);

  const eventsForDay = (day) =>
    tasks.filter((task) => {
      const when = task.scheduledDate || task.dueDate;
      if (!when) return false;
      return sameDay(new Date(when), day);
    });

  const updateScheduledDate = async (taskId, day) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      await api.put(`/tasks/${taskId}`, {
        ...task,
        scheduledDate: day.toISOString(),
      });
      await Promise.all([fetchCalendarTasks(), refreshDashboard()]);
      showToast("Task rescheduled");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to reschedule");
    }
  };

  const filteredAgenda = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.dueDate || t.scheduledDate)
        .sort((a, b) => new Date(a.scheduledDate || a.dueDate) - new Date(b.scheduledDate || b.dueDate)),
    [tasks]
  );

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  if (loading) return <div className="card p-6 text-[#5B9EA8]">Loading calendar...</div>;

  return (
    <div className="space-y-4">
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#082F38]">Calendar & Scheduling</h2>
            <p className="text-sm text-[#5B9EA8] mt-1">Same tasks, different time-based view. No duplicate data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {views.map((item) => (
              <button
                key={item}
                className={`btn ${view === item ? "btn-primary" : "btn-secondary"} !text-xs`}
                onClick={() => setView(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button className="btn btn-secondary !text-xs" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>Previous</button>
          <button className="btn btn-secondary !text-xs" onClick={() => setCursor(new Date())}>Today</button>
          <button className="btn btn-secondary !text-xs" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>Next</button>
          <span className="text-sm font-medium text-[#082F38] ml-1">{monthLabel}</span>
          <input type="date" className="form-input !text-xs !py-1 !px-2 ml-auto" onChange={(e) => e.target.value && setCursor(new Date(e.target.value))} />
        </div>
      </section>

      {(view === "month" || view === "week" || view === "day") && (
        <section className="card p-4">
          <div className={`grid gap-2 ${view === "day" ? "grid-cols-1" : view === "week" ? "grid-cols-7" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-7"}`}>
            {(view === "day" ? [new Date()] : view === "week" ? monthDays.slice(0, 7) : monthDays).map((day) => (
              <div
                key={day.toISOString()}
                className="border border-[#E2F4F6] rounded-lg p-2 min-h-[120px] bg-white"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragTaskId && updateScheduledDate(dragTaskId, day)}
              >
                <p className="text-xs font-semibold text-[#082F38]">{day.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</p>
                <div className="space-y-1 mt-2">
                  {eventsForDay(day).map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => setDragTaskId(task._id)}
                      onClick={() => window.alert(`${task.title}\n\n${task.description || "No description"}`)}
                      className="text-[11px] p-1 rounded bg-[#F0F9FA] border border-[#C4E9ED] cursor-pointer"
                    >
                      <p className="font-medium text-[#082F38] truncate">{task.title}</p>
                      <p className="text-[#5B9EA8]">{dueBadge(task)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "agenda" && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-[#082F38]">Agenda</h3>
          {filteredAgenda.length === 0 ? (
            <p className="text-[#5B9EA8] mt-3">No scheduled or due tasks.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredAgenda.map((task) => {
                const when = new Date(task.scheduledDate || task.dueDate);
                return (
                  <div key={task._id} className="border border-[#E2F4F6] rounded-lg p-3">
                    <p className="font-medium text-[#082F38]">{task.title}</p>
                    <p className="text-xs text-[#5B9EA8]">{when.toLocaleString()} • {dueBadge(task)} • {task.status.replace("_", " ")}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
