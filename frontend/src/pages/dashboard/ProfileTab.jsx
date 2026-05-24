import React from "react";
import { FiMail, FiShield, FiUser } from "react-icons/fi";
import { useDashboardWorkspace } from "./DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

export default function ProfileTab() {
  const { dashboardData, openProfileModal } = useDashboardWorkspace();
  const [activeTab, setActiveTab] = React.useState("profile");
  const user = dashboardData?.user || {};
  const overview = dashboardData?.overview || {};
  const accountType = user.provider === "google" ? "Google" : "Local";

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#E2F4F6] border border-[#C4E9ED] flex items-center justify-center">
              {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <FiUser className="text-[#0E7490] text-xl" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#082F38]">Profile</h2>
              <p className="text-sm text-[#5B9EA8]">Manage your account preferences and identity.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openProfileModal}>Edit Profile</button>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {["profile", "settings", "preferences", "security"].map((tab) => (
          <button
            key={tab}
            className={`px-3 py-2 rounded-lg text-sm border ${
              activeTab === tab ? "bg-[#0E7490] text-white border-[#0E7490]" : "bg-white text-[#0E7490] border-[#C4E9ED]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </section>

      {activeTab === "profile" && <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Name</p><p className="font-semibold text-[#082F38]">{user.fullName}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Email</p><p className="font-semibold text-[#082F38] flex items-center gap-2"><FiMail /> {user.email}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Provider</p><p className="font-semibold text-[#082F38]">{accountType}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Verification</p><p className="font-semibold text-[#082F38] flex items-center gap-2"><FiShield /> {user.emailVerified ? "Verified" : "Unverified"}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Joined Date</p><p className="font-semibold text-[#082F38]">{formatDate(user.createdAt)}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Last Login</p><p className="font-semibold text-[#082F38]">{formatDate(user.lastLoginAt)}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Bio</p><p className="font-semibold text-[#082F38]">{user.bio || "No bio added"}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Timezone</p><p className="font-semibold text-[#082F38]">{user.timezone || "Not set"}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Theme Preference</p><p className="font-semibold text-[#082F38] capitalize">{user.themePreference || "light"}</p></div>
      </section>}

      {activeTab === "profile" && <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Total Tasks</p><p className="font-semibold text-[#082F38]">{overview.totalTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Completed Tasks</p><p className="font-semibold text-[#082F38]">{overview.completedTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Pending Tasks</p><p className="font-semibold text-[#082F38]">{overview.pendingTasks || 0}</p></div>
        <div className="card p-5"><p className="text-xs text-[#5B9EA8]">Completion %</p><p className="font-semibold text-[#082F38]">{overview.completionRate || 0}%</p></div>
      </section>}

      {activeTab === "settings" && (
        <section className="card p-6">
          <h3 className="font-semibold text-[#082F38]">Settings</h3>
          <p className="text-sm text-[#5B9EA8] mt-2">Appearance, account, and notification settings are managed through Edit Profile.</p>
          <button className="btn btn-primary mt-4" onClick={openProfileModal}>Open Edit Profile</button>
        </section>
      )}

      {activeTab === "preferences" && (
        <section className="card p-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#E2F4F6] p-4">
            <p className="text-xs text-[#5B9EA8]">Theme</p>
            <p className="font-semibold text-[#082F38] capitalize">{user.themePreference || "light"}</p>
          </div>
          <div className="rounded-lg border border-[#E2F4F6] p-4">
            <p className="text-xs text-[#5B9EA8]">Timezone</p>
            <p className="font-semibold text-[#082F38]">{user.timezone || "Not set"}</p>
          </div>
        </section>
      )}

      {activeTab === "security" && (
        <section className="card p-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#E2F4F6] p-4">
            <p className="text-xs text-[#5B9EA8]">Provider</p>
            <p className="font-semibold text-[#082F38]">{accountType}</p>
          </div>
          <div className="rounded-lg border border-[#E2F4F6] p-4">
            <p className="text-xs text-[#5B9EA8]">Email Verification</p>
            <p className="font-semibold text-[#082F38]">{user.emailVerified ? "Verified" : "Unverified"}</p>
          </div>
        </section>
      )}
    </div>
  );
}
