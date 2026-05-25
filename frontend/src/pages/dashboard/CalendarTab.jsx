import React, { useMemo, useState } from "react";
import api from "../../api/client";

const views = ["month", "week", "day", "agenda"];
const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  if (loading) return <div className="card p-6 text-[#5B9EA8]">Loading calendar...</div>;

  return (
    <div className="space-y-4">
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#082F38]">Calendar & Scheduling</h2>
            <p className="text-sm text-[#5B9EA8] mt-1">Date-first view of your personal and assigned work.</p>
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
          <span className="text-sm font-medium text-[#082F38] ml-1">{view === "week" ? weekLabel : monthLabel}</span>
          <input type="date" className="form-input !text-xs !py-1 !px-2 ml-auto" onChange={(e) => e.target.value && setCursor(new Date(e.target.value))} />
        </div>
      </section>

      {(view === "month" || view === "week" || view === "day") && (
        <section className="card p-4">
          {view !== "day" && (
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekdayHeaders.map((day) => (
                <div key={day} className="text-xs font-semibold text-[#5B9EA8] text-center">{day}</div>
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
                  className={`border rounded-lg p-2 min-h-[120px] ${isCurrentMonth ? "bg-white border-[#E2F4F6]" : "bg-[#F8FCFD] border-[#EEF7F9]"}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dragTaskId && updateScheduledDate(dragTaskId, day)}
                >
                  <p className={`text-xs font-semibold ${isCurrentMonth ? "text-[#082F38]" : "text-[#9DB7BD]"}`}>
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
                          className="w-full text-left text-[11px] p-1 rounded border cursor-pointer"
                          style={{
                            background: isProjectTask ? `${projectColor}14` : "#F0F9FA",
                            borderColor: isProjectTask ? `${projectColor}50` : "#C4E9ED",
                          }}
                        >
                          <p className="font-medium text-[#082F38] truncate">{task.title}</p>
                          <p style={{ color: isProjectTask ? projectColor : "#5B9EA8" }}>{dueBadge(task)}</p>
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
          <h3 className="text-lg font-semibold text-[#082F38]">Agenda</h3>
          {filteredAgenda.length === 0 ? (
            <p className="text-[#5B9EA8] mt-3">No scheduled or deadline-based tasks.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {filteredAgenda.map((task) => {
                const when = new Date(task.scheduledDate || task.dueDate);
                const projectColor = task.projectColor || "#0E7490";
                const isProjectTask = Boolean(task.projectId);
                return (
                  <button
                    key={task._id}
                    onClick={() => onEditTask?.(task)}
                    className="w-full text-left border rounded-lg p-3"
                    style={{ borderColor: isProjectTask ? `${projectColor}55` : "#E2F4F6" }}
                  >
                    <p className="font-medium text-[#082F38]">{task.title}</p>
                    <p className="text-xs text-[#5B9EA8]">
                      {when.toLocaleString()} | {dueBadge(task)} | {task.status.replace("_", " ")}
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
