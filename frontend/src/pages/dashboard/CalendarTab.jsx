import React, { useMemo, useState } from "react";
import api from "../../api/client";

const views = ["month", "week", "day", "agenda"];
const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dueBadge(task) {
  const when = task.scheduledDate || task.dueDate;
  if (!when) return "No date";
  const now = new Date();
  const d = new Date(when);
  const diff = Math.floor((startOfDay(d) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  if (task.status !== "completed" && d < now) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 3) return "Due Soon";
  return "Upcoming";
}

function buildMonthGrid(cursor) {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - start.getDay());
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

function buildWeekGrid(cursor) {
  const d = new Date(cursor);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function CalendarTab({ tasks = [], loading = false, onRefresh, onEditTask, showToast }) {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [dragTaskId, setDragTaskId] = useState(null);

  const monthGrid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const weekGrid = useMemo(() => buildWeekGrid(cursor), [cursor]);

  const eventsForDay = (day) =>
    tasks.filter((task) => {
      const when = task.scheduledDate || task.dueDate;
      if (!when) return false;
      return sameDay(new Date(when), day);
    });

  const filteredAgenda = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.dueDate || t.scheduledDate)
        .sort((a, b) => new Date(a.scheduledDate || a.dueDate) - new Date(b.scheduledDate || b.dueDate)),
    [tasks]
  );

  const updateScheduledDate = async (taskId, day) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;
      await api.put(`/tasks/${taskId}`, {
        ...task,
        scheduledDate: day.toISOString(),
      });
      await onRefresh?.();
      showToast?.("Task rescheduled");
    } catch (err) {
      showToast?.(err?.response?.data?.message || "Failed to reschedule");
    }
  };

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const weekLabel = `${weekGrid[0].toLocaleDateString()} - ${weekGrid[6].toLocaleDateString()}`;

  if (loading) return <div className="card p-6 text-[var(--text-muted)]">Loading calendar...</div>;

  return (
    <div className="space-y-4">
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Calendar & Scheduling</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Date-first view of your personal and assigned work.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {views.map((item) => (
              <button key={item} className={`btn ${view === item ? "btn-primary" : "btn-secondary"} !text-xs`} onClick={() => setView(item)}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button
            className="btn btn-secondary !text-xs"
            onClick={() =>
              setCursor((prev) => {
                const next = new Date(prev);
                next.setDate(view === "day" ? prev.getDate() - 1 : view === "week" ? prev.getDate() - 7 : 1);
                if (view === "month") next.setMonth(prev.getMonth() - 1);
                return next;
              })
            }
          >
            Previous
          </button>
          <button className="btn btn-secondary !text-xs" onClick={() => setCursor(new Date())}>Today</button>
          <button
            className="btn btn-secondary !text-xs"
            onClick={() =>
              setCursor((prev) => {
                const next = new Date(prev);
                next.setDate(view === "day" ? prev.getDate() + 1 : view === "week" ? prev.getDate() + 7 : 1);
                if (view === "month") next.setMonth(prev.getMonth() + 1);
                return next;
              })
            }
          >
            Next
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)] ml-1">{view === "week" ? weekLabel : monthLabel}</span>
          <input type="date" className="form-input !text-xs !py-1 !px-2 ml-auto" onChange={(e) => e.target.value && setCursor(new Date(e.target.value))} />
        </div>
      </section>

      {(view === "month" || view === "week" || view === "day") && (
        <section className="card p-4">
          {view !== "day" && (
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekdayHeaders.map((day) => (
                <div key={day} className="text-xs font-semibold text-[var(--text-muted)] text-center">{day}</div>
              ))}
            </div>
          )}

          <div className={`grid gap-2 ${view === "month" || view === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
            {(view === "month" ? monthGrid : view === "week" ? weekGrid : [startOfDay(cursor)]).map((day) => {
              const dayEvents = eventsForDay(day);
              const isCurrentMonth = day.getMonth() === cursor.getMonth();
              return (
                <div
                  key={day.toISOString()}
                  className={`border rounded-lg p-2 min-h-[120px] ${isCurrentMonth ? "bg-[var(--surface)] border-[var(--line-soft)]" : "bg-[var(--surface-subtle)] border-[var(--line-soft)] opacity-60"}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dragTaskId && updateScheduledDate(dragTaskId, day)}
                >
                  <p className={`text-xs font-semibold ${isCurrentMonth ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                    {day.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                  </p>
                  <div className="space-y-1 mt-2">
                    {dayEvents.map((task) => {
                      const projectColor = task.projectColor || "#0E7490";
                      const isProjectTask = Boolean(task.projectId);
                      return (
                        <button
                          key={task._id}
                          draggable
                          onDragStart={() => setDragTaskId(task._id)}
                          onClick={() => onEditTask?.(task)}
                          className="w-full text-left text-[11px] p-1.5 rounded cursor-pointer transition-all hover:opacity-90"
                          style={{
                            background: isProjectTask ? `${projectColor}15` : "var(--surface-subtle)",
                            border: `1px solid ${isProjectTask ? `${projectColor}30` : "var(--line-soft)"}`,
                            borderLeft: `3px solid ${isProjectTask ? projectColor : "var(--brand-primary)"}`
                          }}
                        >
                          <p className="font-semibold text-[var(--text-primary)] truncate">{task.title}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: isProjectTask ? projectColor : "var(--text-muted)" }}>{dueBadge(task)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {view === "agenda" && (
        <section className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Agenda</h3>
          {filteredAgenda.length === 0 ? (
            <p className="text-[var(--text-muted)] mt-3">No scheduled or deadline-based tasks.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredAgenda.map((task) => {
                const projectColor = task.projectColor || "#0E7490";
                const isProjectTask = Boolean(task.projectId);
                return (
                  <button
                    key={task._id}
                    onClick={() => onEditTask?.(task)}
                    className="w-full text-left border rounded-lg p-3 transition-all hover:shadow-sm bg-[var(--surface)] text-[var(--text-primary)]"
                    style={{ 
                      borderColor: isProjectTask ? `${projectColor}30` : "var(--line-soft)",
                      borderLeft: `4px solid ${isProjectTask ? projectColor : "var(--brand-primary)"}`
                    }}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {task.scheduledDate 
                        ? `Scheduled: ${new Date(task.scheduledDate).toLocaleDateString()}` 
                        : `Deadline: ${formatDeadline(task.dueDate)}`} | {dueBadge(task)} | {task.status.replace("_", " ")}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
