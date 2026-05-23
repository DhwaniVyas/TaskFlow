import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { googleLogout } from "@react-oauth/google";
import api from "../../api/client";
import { clearToken } from "../../utils/auth";
import ProfileEditModal from "../../components/dashboard/ProfileEditModal";

const DashboardContext = createContext(null);

export function useDashboardWorkspace() {
  return useContext(DashboardContext);
}

const tabConfig = [
  { key: "overview", label: "Overview", path: "/dashboard/overview", comingSoon: false },
  { key: "tasks", label: "Tasks", path: "/dashboard/tasks", comingSoon: false },
  { key: "profile", label: "Profile", path: "/dashboard/profile", comingSoon: false },
  { key: "calendar", label: "Calendar", path: "/dashboard/calendar", comingSoon: true },
  { key: "analytics", label: "Analytics", path: "/dashboard/analytics", comingSoon: true },
  { key: "notifications", label: "Notifications", path: "/dashboard/notifications", comingSoon: true },
  { key: "settings", label: "Settings", path: "/dashboard/settings", comingSoon: true },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [toast, setToast] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [taskState, setTaskState] = useState({
    search: "",
    statusFilter: "",
    priorityFilter: "",
    dueFilter: "",
    completedFilter: "",
    sortBy: "",
    tasks: [],
    tasksLoading: false,
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const refreshDashboard = async () => {
    const { data } = await api.get("/dashboard");
    setDashboardData(data.data);
    return data.data;
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshDashboard();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setInitialLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleLogout = () => {
    api.post("/auth/logout").catch(() => {});
    googleLogout();
    clearToken();
    navigate("/login");
  };

  const saveProfile = async (form) => {
    try {
      setProfileSaving(true);
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await api.put("/auth/me", payload);
      setDashboardData((prev) => ({ ...prev, user: data.data }));
      setShowProfileModal(false);
      showToast("Profile updated");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      dashboardData,
      refreshDashboard,
      toast,
      showToast,
      taskState,
      setTaskState,
      openProfileModal: () => setShowProfileModal(true),
    }),
    [dashboardData, toast, taskState]
  );

  if (initialLoading) {
    return <div className="min-h-screen flex items-center justify-center text-[#0E7490]">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[#DC2626] font-medium">{error}</p>
        <button onClick={handleLogout} className="btn btn-primary">Go to Login</button>
      </div>
    );
  }

  const user = dashboardData?.user || {};

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-b from-[#F0F9FA] to-white">
        <header className="border-b border-[#C4E9ED]/50 bg-white/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#5B9EA8] font-semibold">Dashboard</p>
              <h1 className="text-xl md:text-2xl font-bold text-[#082F38]">Welcome, {user.fullName}</h1>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary flex items-center gap-2">
              <FiLogOut /> Logout
            </button>
          </div>

          <div className="max-w-6xl mx-auto px-6 pb-3 overflow-x-auto">
            <nav className="flex items-center gap-2 min-w-max">
              {tabConfig.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      isActive
                        ? "bg-[#0E7490] text-white border-[#0E7490]"
                        : "bg-white text-[#0E7490] border-[#C4E9ED] hover:bg-[#E2F4F6]"
                    }`
                  }
                >
                  {tab.label}
                  {tab.comingSoon && <span className="ml-2 text-[10px] uppercase tracking-wide opacity-80">Coming Soon</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </main>

        <ProfileEditModal
          open={showProfileModal}
          user={dashboardData?.user}
          saving={profileSaving}
          onSave={saveProfile}
          onClose={() => setShowProfileModal(false)}
        />

        {toast && (
          <div className="fixed bottom-4 right-4 bg-[#082F38] text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
            {toast}
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
