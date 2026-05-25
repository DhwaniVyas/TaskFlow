import React from "react";
import { FiMail, FiShield, FiUser } from "react-icons/fi";
import { useDashboardWorkspace } from "./DashboardLayout";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[var(--surface)] p-4">
      <p className="text-xs text-[#5B9EA8]">{label}</p>
      <p className="font-semibold text-[#082F38] mt-1">{value}</p>
    </div>
  );
}

export default function ProfileTab() {
  const { dashboardData, openProfileModal } = useDashboardWorkspace();
  const user = dashboardData?.user || {};
  const overview = dashboardData?.overview || {};
  const accountType = user.provider === "google" ? "Google" : "Local";
  const notifications = user.notificationPreferences || {};

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#E2F4F6] border border-[#C4E9ED] flex items-center justify-center">
              {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : <FiUser className="text-[#0E7490] text-xl" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#082F38]">Profile & Settings</h2>
              <p className="text-sm text-[#5B9EA8] mt-1">Account identity, preferences, security, and appearance in one place.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openProfileModal}>Edit Profile</button>
        </div>
      </section>

      <section className="equal-split-row relaxed" style={{ "--split-count": 4 }}>
        <InfoCard label="Name" value={user.fullName || "N/A"} />
        <InfoCard label="Email" value={user.email || "N/A"} />
        <InfoCard label="Provider" value={accountType} />
        <InfoCard label="Joined" value={formatDate(user.createdAt)} />
        <InfoCard label="Verification" value={user.emailVerified ? "Verified" : "Unverified"} />
        <InfoCard label="Project Count" value={overview.activeProjects || 0} />
        <InfoCard label="Total Tasks" value={overview.totalTasks || 0} />
        <InfoCard label="Completion %" value={`${overview.completionRate || 0}%`} />
      </section>

      <section className="equal-split-row relaxed" style={{ "--split-count": 2 }}>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[#082F38]">Profile</h3>
          <div className="equal-split-row relaxed mt-4" style={{ "--split-count": 2 }}>
            <InfoCard label="Bio" value={user.bio || "No bio added"} />
            <InfoCard label="Timezone" value={user.timezone || "Not set"} />
            <InfoCard label="Last Login" value={formatDate(user.lastLoginAt)} />
            <InfoCard label="Theme" value={(user.themePreference || "light").toUpperCase()} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[#082F38]">Security & Preferences</h3>
          <div className="equal-split-row relaxed mt-4" style={{ "--split-count": 2 }}>
            <InfoCard label="Account Type" value={accountType} />
            <InfoCard label="Email Status" value={user.emailVerified ? "Verified" : "Pending"} />
            <InfoCard label="Mail Notifications" value={notifications.email ? "Enabled" : "Disabled"} />
            <InfoCard label="Comment Alerts" value={notifications.comments ? "Enabled" : "Disabled"} />
          </div>
          <div className="mt-4 text-sm text-[#5B9EA8] flex items-center gap-2">
            <FiMail /> Notification preferences, password, theme, and avatar are managed through Edit Profile.
          </div>
          <div className="mt-2 text-sm text-[#5B9EA8] flex items-center gap-2">
            <FiShield /> Email, provider, and joined date remain read-only.
          </div>
        </div>
      </section>
    </div>
  );
}
