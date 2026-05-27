import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { FiRefreshCw, FiMessageSquare } from "react-icons/fi";
import { useDashboardWorkspace } from "./DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function getReadableType(type) {
  const mapping = {
    project_creation: "Project Created",
    project_invite: "Project Invitation",
    invite_acceptance: "Invitation Accepted",
    project_update: "Project Updated",
    task_created: "Task Created",
    task_assigned: "Task Assigned",
    task_completed: "Task Completed",
    deadline_reminder: "Upcoming Deadline",
  };
  return mapping[type] || type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function NotificationsTab() {
  const { dashboardData, openProfileModal } = useDashboardWorkspace();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All"); // All, Project, Task

  const user = dashboardData?.user || {};
  const hasPhoneNumber = Boolean(user.phoneNumber && String(user.phoneNumber).trim().length > 0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications");
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = notifications.filter((n) => {
    if (filter === "All") return true;
    return n.category === filter;
  });

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Notifications History</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              View SMS and system alerts sent for project updates and task actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="btn btn-secondary !py-2 !px-3"
              title="Refresh notifications"
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "animate-spin text-[var(--brand-primary)]" : "text-[var(--text-primary)]"} />
            </button>
            <div className="flex bg-[var(--surface-subtle)] border border-[var(--line-soft)] rounded-lg p-1">
              {["All", "Project", "Task"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === cat
                      ? "bg-[var(--brand-primary)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!hasPhoneNumber && (
        <div className="p-4 rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <span className="text-xl shrink-0">📱</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Enable SMS alerts</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Add a phone number in Profile Settings to receive SMS notifications for assignments and reminders.
              </p>
            </div>
          </div>
          <button
            onClick={openProfileModal}
            className="btn btn-secondary hover:!border-[var(--brand-accent)] !py-1.5 !px-3.5 !text-xs shrink-0 self-stretch sm:self-auto"
          >
            Configure SMS
          </button>
        </div>
      )}

      {loading ? (
        <div className="card p-6 text-center text-[var(--text-muted)]">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)] border border-[var(--line-soft)]">
          <FiMessageSquare className="mx-auto text-3xl mb-3 text-[var(--text-muted)] opacity-50" />
          <p className="font-medium text-[var(--text-primary)]">No notifications found</p>
          <p className="text-xs mt-1">When project or task actions occur, your log will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const isProject = n.category === "Project";
            const statusColors = {
              sent: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
              failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
              pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            };
            
            // Neon cyan for task, electric indigo/purple highlight for project
            const categoryColors = isProject
              ? "bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)] border-[var(--brand-secondary)]/30"
              : "bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/30";

            return (
              <div
                key={n._id}
                className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--line-soft)] hover:border-[var(--brand-primary)]/40 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge border text-[10px] ${categoryColors}`}>
                      {n.category}
                    </span>
                    <span className="font-semibold text-sm text-[var(--text-primary)]">
                      {getReadableType(n.type)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] break-words line-clamp-3">
                    {n.message}
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 border-[var(--line-soft)] pt-2 md:pt-0">
                  <div className="flex flex-col md:items-end text-xs text-[var(--text-muted)]">
                    <span className="font-medium">{formatDate(n.sentAt)}</span>
                    <span className="opacity-80 mt-0.5">{formatTime(n.sentAt)}</span>
                  </div>
                  <span className={`badge border text-[9px] px-2 py-0.5 rounded-full capitalize ${statusColors[n.deliveryStatus] || statusColors.pending}`}>
                    SMS: {n.deliveryStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
