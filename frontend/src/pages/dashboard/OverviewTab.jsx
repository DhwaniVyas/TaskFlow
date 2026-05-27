import React, { useEffect } from "react";
import { FiBarChart2, FiCheckCircle, FiCheckSquare, FiClock, FiUser, FiActivity } from "react-icons/fi";
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
  const { dashboardData, refreshDashboard } = useDashboardWorkspace();

  useEffect(() => {
    // Refresh stats and activity log on load/tab switch
    refreshDashboard();
  }, [refreshDashboard]);

  const user = dashboardData?.user || {};
  const overview = dashboardData?.overview || {};
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];
  const recentActivities = dashboardData?.recentActivities || [];

  return (
    <div className="space-y-6">
      <section className="equal-split-row relaxed" style={{ "--split-count": 6 }}>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">Total Tasks</p><p className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiCheckSquare /> {overview.totalTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">Completed</p><p className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiCheckCircle /> {overview.completedTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">Pending</p><p className="text-2xl font-bold text-[var(--text-primary)]">{overview.pendingTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">Overdue</p><p className="text-2xl font-bold text-[#DC2626]">{overview.overdueTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">High Priority</p><p className="text-2xl font-bold text-[#F97316]">{overview.highPriorityTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[var(--text-muted)] mb-2 font-semibold uppercase tracking-wider">Completion %</p><p className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiBarChart2 /> {overview.completionRate || 0}%</p></div>
      </section>

      <section className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
        <div className="card p-6 border border-[var(--line-soft)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FiCalendarIcon /> Upcoming Deadlines
          </h3>
          <div className="mt-4 space-y-2.5 text-sm">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[var(--text-muted)]">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div key={task._id} className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-3 hover-lift text-left">
                  <p className="font-semibold text-[var(--text-primary)]">{task.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-2">
                    <span>Due: {formatDeadline(task.dueDate)}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--line-soft)]" />
                    <span className="capitalize font-bold text-[var(--brand-accent)]">{task.priority} Priority</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6 border border-[var(--line-soft)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FiActivity className="text-[var(--brand-primary)]" /> Recent Activities
          </h3>
          <div className="mt-4 space-y-2.5 text-sm">
            {recentActivities.length === 0 ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-left">
                  <FiUser className="text-[var(--brand-primary)] text-lg" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Profile ready for updates</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Setup completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-left">
                  <FiCheckSquare className="text-[var(--brand-primary)] text-lg" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Task workspace active</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Workspace initialized</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] text-left">
                  <FiClock className="text-[var(--brand-primary)] text-lg" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Last login logged</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatDate(user.lastLoginAt)}</p>
                  </div>
                </div>
              </>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] hover-lift text-left">
                  <div className="text-[var(--brand-primary)] mt-0.5 text-base shrink-0">
                    <FiClock />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-tight truncate-two-lines">
                      {activity.action}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function FiCalendarIcon() {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand-primary)]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
