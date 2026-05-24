import React, { useEffect, useState } from "react";
import { FiBarChart2, FiCheckCircle, FiCheckSquare, FiClock, FiPlayCircle, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useDashboardWorkspace } from "./DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

export default function OverviewTab() {
  const navigate = useNavigate();
  const { dashboardData, openProfileModal } = useDashboardWorkspace();
  const [latestTasks, setLatestTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setPreviewLoading(true);
        const { data } = await api.get("/tasks");
        const rows = data.data || [];
        setLatestTasks(rows.slice(0, 5));
        const next = rows
          .filter((t) => t.dueDate && t.status !== "completed")
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
        setUpcomingTasks(next);
      } catch {
        setLatestTasks([]);
        setUpcomingTasks([]);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreview();
  }, []);

  const user = dashboardData?.user || {};
  const overview = dashboardData?.overview || {};

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold text-[#082F38]">Overview</h2>
        <p className="text-sm text-[#5B9EA8] mt-1">Everything important at a glance.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/dashboard/tasks" className="btn btn-primary">View All Tasks</Link>
          <button onClick={() => navigate("/dashboard/tasks?view=board")} className="btn btn-secondary">Open Board</button>
          <button onClick={() => navigate("/dashboard/tasks?view=calendar")} className="btn btn-secondary">Open Calendar</button>
          <button onClick={openProfileModal} className="btn btn-secondary">Edit Profile</button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-5">
        <div className="card p-5"><p className="text-xs text-[#5B9EA8] mb-2">Total Tasks</p><p className="text-2xl font-bold text-[#082F38] flex items-center gap-2"><FiCheckSquare /> {overview.totalTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8] mb-2">Completed</p><p className="text-2xl font-bold text-[#082F38] flex items-center gap-2"><FiCheckCircle /> {overview.completedTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8] mb-2">Pending</p><p className="text-2xl font-bold text-[#082F38]">{overview.pendingTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8] mb-2">Overdue</p><p className="text-2xl font-bold text-[#DC2626]">{overview.overdueTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8] mb-2">High Priority</p><p className="text-2xl font-bold text-[#F97316]">{overview.highPriorityTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8] mb-2">Completion %</p><p className="text-2xl font-bold text-[#082F38] flex items-center gap-2"><FiBarChart2 /> {overview.completionRate || 0}%</p></div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[#082F38]">Account Summary</h3>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div><p className="text-[#5B9EA8]">Name</p><p className="font-medium text-[#082F38]">{user.fullName}</p></div>
            <div><p className="text-[#5B9EA8]">Email</p><p className="font-medium text-[#082F38]">{user.email}</p></div>
            <div><p className="text-[#5B9EA8]">Provider</p><p className="font-medium text-[#082F38]">{user.provider === "google" ? "Google" : "Local"}</p></div>
            <div><p className="text-[#5B9EA8]">Verified</p><p className="font-medium text-[#082F38]">{user.emailVerified ? "Yes" : "No"}</p></div>
            <div><p className="text-[#5B9EA8]">Joined</p><p className="font-medium text-[#082F38]">{formatDate(user.createdAt)}</p></div>
            <div><p className="text-[#5B9EA8]">Last Login</p><p className="font-medium text-[#082F38]">{formatDate(user.lastLoginAt)}</p></div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[#082F38]">Upcoming Deadlines</h3>
          <div className="mt-4 space-y-3 text-sm">
            {upcomingTasks.length === 0 ? (
              <p className="text-[#5B9EA8]">No upcoming deadlines.</p>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[#5B9EA8]"><FiClock /> {task.title}</p>
                  <span className="text-xs text-[#082F38] font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold text-[#082F38]">Recent Activity</h3>
        <div className="mt-4 space-y-3 text-sm">
          <p className="flex items-center gap-2 text-[#5B9EA8]"><FiUser /> Profile ready for updates</p>
          <p className="flex items-center gap-2 text-[#5B9EA8]"><FiCheckSquare /> Task workspace active</p>
          <p className="flex items-center gap-2 text-[#5B9EA8]"><FiClock /> Last login: {formatDate(user.lastLoginAt)}</p>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#082F38]">Latest Tasks</h3>
          <Link to="/dashboard/tasks" className="btn btn-secondary">View All Tasks</Link>
        </div>
        {previewLoading ? (
          <p className="text-[#5B9EA8] mt-4">Loading latest tasks...</p>
        ) : latestTasks.length === 0 ? (
          <p className="text-[#5B9EA8] mt-4">No tasks yet. Create your first one in Tasks tab.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {latestTasks.map((task) => (
              <div key={task._id} className="border border-[#E2F4F6] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#082F38]">{task.title}</p>
                  <p className="text-xs text-[#5B9EA8]">{task.status.replace("_", " ")} • {task.priority}</p>
                </div>
                <FiPlayCircle className="text-[#0E7490]" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
