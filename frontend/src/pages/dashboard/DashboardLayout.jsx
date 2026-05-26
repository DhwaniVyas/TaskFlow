import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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
  { key: "projects", label: "Projects", path: "/dashboard/projects", comingSoon: false },
  { key: "analytics", label: "Analytics", path: "/dashboard/analytics", comingSoon: false },
  { key: "notifications", label: "Notifications", path: "/dashboard/notifications", comingSoon: false },
  { key: "profile", label: "Profile & Settings", path: "/dashboard/profile", comingSoon: false },
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

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const refreshDashboard = useCallback(async () => {
    const { data } = await api.get("/dashboard");
    setDashboardData(data.data);
    return data.data;
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshDashboard();
        
        // Auto-accept pending invite if one exists
        const pendingToken = sessionStorage.getItem("pending_invite_token");
        if (pendingToken) {
          try {
            await api.post("/projects/accept-invite", { token: pendingToken });
            sessionStorage.removeItem("pending_invite_token");
            showToast("Project invitation accepted!");
            // Refresh to load the newly accepted project data
            await refreshDashboard();
          } catch (inviteErr) {
            console.error("Auto-accept invite error:", inviteErr);
            const msg = inviteErr?.response?.data?.message || "";
            if (msg.includes("Invite does not match this account")) {
              clearToken();
              navigate("/login");
              showToast("This invite is for a different email. Please log in with the correct account.");
            } else {
              sessionStorage.removeItem("pending_invite_token");
              showToast(msg || "Failed to accept project invitation");
            }
          }
        }
      } catch (err) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          clearToken();
          navigate("/login");
        } else {
          setError(err?.response?.data?.message || "Failed to load dashboard");
        }
      } finally {
        setInitialLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    const theme = dashboardData?.user?.themePreference || "light";
    document.documentElement.classList.remove("theme-light", "theme-dark");
    if (theme === "system") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.add(prefersDark ? "theme-dark" : "theme-light");
      return;
    }
    document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
  }, [dashboardData?.user?.themePreference]);

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

  const openProfileModal = useCallback(() => setShowProfileModal(true), []);

  const contextValue = useMemo(
    () => ({
      dashboardData,
      refreshDashboard,
      toast,
      showToast,
      taskState,
      setTaskState,
      openProfileModal,
    }),
    [dashboardData, refreshDashboard, toast, showToast, taskState, openProfileModal]
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
      <div className="min-h-screen app-bg">
        <header className="border-b border-[var(--line-soft)] bg-[var(--surface)]/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Dashboard</p>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">Welcome, {user.fullName}</h1>
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
                        ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                        : "bg-[var(--surface)] text-[var(--brand-primary)] border-[var(--line-soft)] hover:bg-[var(--surface-subtle)]"
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
          <div className="fixed bottom-4 right-4 bg-[var(--text-primary)] text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
            {toast}
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
