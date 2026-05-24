import React from "react";
import { FiBarChart2, FiCheckCircle, FiCheckSquare, FiClock, FiUser } from "react-icons/fi";
import { useDashboardWorkspace } from "./DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

export default function OverviewTab() {
  const { dashboardData, openProfileModal } = useDashboardWorkspace();

  const user = dashboardData?.user || {};
  const overview = dashboardData?.overview || {};

  return (
    <div className="space-y-6">
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
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold text-[#082F38]">Recent Activity</h3>
        <div className="mt-4 space-y-3 text-sm">
          <p className="flex items-center gap-2 text-[#5B9EA8]"><FiUser /> Profile ready for updates</p>
          <p className="flex items-center gap-2 text-[#5B9EA8]"><FiCheckSquare /> Task workspace active</p>
          <p className="flex items-center gap-2 text-[#5B9EA8]"><FiClock /> Last login: {formatDate(user.lastLoginAt)}</p>
        </div>
      </section>
    </div>
  );
}
