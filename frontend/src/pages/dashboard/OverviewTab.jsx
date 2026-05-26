import React from "react";
import { FiBarChart2, FiCheckCircle, FiCheckSquare, FiClock, FiUser } from "react-icons/fi";
import { useDashboardWorkspace } from "./DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
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

export default function OverviewTab() {
  const { dashboardData } = useDashboardWorkspace();

  const user = dashboardData?.user || {};
  const overview = dashboardData?.overview || {};
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];
  const recentActivities = dashboardData?.recentActivities || [];

  return (
    <div className="space-y-6">
      <section className="equal-split-row relaxed" style={{ "--split-count": 6 }}>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2">Total Tasks</p><p className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiCheckSquare /> {overview.totalTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2">Completed</p><p className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiCheckCircle /> {overview.completedTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2">Pending</p><p className="text-2xl font-bold text-[var(--text-primary)]">{overview.pendingTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2">Overdue</p><p className="text-2xl font-bold text-[#DC2626]">{overview.overdueTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2">High Priority</p><p className="text-2xl font-bold text-[#F97316]">{overview.highPriorityTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2">Completion %</p><p className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiBarChart2 /> {overview.completionRate || 0}%</p></div>
      </section>

      <section className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
        <div className="card p-6 border border-[var(--line-soft)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Upcoming Deadlines</h3>
          <div className="mt-4 space-y-2 text-sm">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[var(--text-muted)]">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div key={task._id} className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-3">
                  <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{formatDeadline(task.dueDate)} | {task.priority}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card p-6 border border-[var(--line-soft)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Activities</h3>
          <div className="mt-4 space-y-3 text-sm">
            {recentActivities.length === 0 ? (
              <>
                <p className="flex items-center gap-2 text-[var(--text-muted)]"><FiUser /> Profile ready for updates</p>
                <p className="flex items-center gap-2 text-[var(--text-muted)]"><FiCheckSquare /> Task workspace active</p>
                <p className="flex items-center gap-2 text-[var(--text-muted)]"><FiClock /> Last login: {formatDate(user.lastLoginAt)}</p>
              </>
            ) : (
              recentActivities.map((activity) => (
                <p key={activity._id} className="flex items-center gap-2 text-[var(--text-muted)]">
                  <FiClock /> {activity.action}
                </p>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
