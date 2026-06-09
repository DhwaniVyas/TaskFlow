import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiBell, 
  FiUser, 
  FiCheckSquare, 
  FiPieChart, 
  FiFolder, 
  FiBarChart2 
} from "react-icons/fi";
import { googleLogout } from "@react-oauth/google";
import api from "../../api/client";
import { clearToken } from "../../utils/auth";
import ProfileEditModal from "../../components/dashboard/ProfileEditModal";

const DashboardContext = createContext(null);

export function useDashboardWorkspace() {
  return useContext(DashboardContext);
}

const tabConfig = [
  { key: "overview", label: "Overview", path: "/dashboard/overview", icon: FiPieChart },
  { key: "tasks", label: "Tasks", path: "/dashboard/tasks", icon: FiCheckSquare },
  { key: "projects", label: "Projects", path: "/dashboard/projects", icon: FiFolder },
  { key: "analytics", label: "Analytics", path: "/dashboard/analytics", icon: FiBarChart2 },
  { key: "notifications", label: "Notifications", path: "/dashboard/notifications", icon: FiBell },
  { key: "profile", label: "Profile & Settings", path: "/dashboard/profile", icon: FiUser },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [toast, setToast] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  }, [navigate, refreshDashboard, showToast]);

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--app-bg)] text-[var(--brand-primary)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-primary)] mb-4"></div>
        <p className="text-sm font-semibold tracking-wider">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-[var(--app-bg)]">
        <p className="text-[var(--brand-primary)] font-semibold text-lg">{error}</p>
        <button onClick={handleLogout} className="btn btn-primary">Go to Login</button>
      </div>
    );
  }

  const user = dashboardData?.user || {};
  const initials = user.fullName ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "TF";

  const renderNavLinks = (onItemClick = () => {}) => {
    return tabConfig.map((tab) => {
      const Icon = tab.icon;
      return (
        <NavLink
          key={tab.key}
          to={tab.path}
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
              isActive
                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md shadow-[var(--brand-primary)]/10 font-semibold"
                : "bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-subtle)] hover:text-[var(--brand-primary)]"
            }`
          }
        >
          <Icon className="text-lg shrink-0" />
          <span>{tab.label}</span>
        </NavLink>
      );
    });
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[var(--app-bg)] flex flex-col lg:flex-row relative">
        
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 w-64 bg-[var(--sidebar-bg)] border-r border-[var(--line-soft)] hidden lg:flex flex-col justify-between z-30">
          <div className="p-6 space-y-8 flex-1 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-md shadow-[var(--brand-primary)]/10">
                <FiCheckSquare className="text-2xl" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">TaskFlow</span>
                <span className="block text-[10px] text-[var(--brand-primary)] uppercase tracking-wider font-bold">Workspace</span>
              </div>
            </div>

            {/* Links */}
            <nav className="space-y-1.5 flex-1 overflow-y-auto">
              {renderNavLinks()}
            </nav>
          </div>

          {/* User Profile / Logout footer */}
          <div className="p-4 border-t border-[var(--line-soft)] bg-[var(--sidebar-bg)] flex flex-col gap-3">
            <button 
              onClick={openProfileModal} 
              className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[var(--surface)] text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--brand-secondary)] text-[var(--text-primary)] font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.fullName}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            </button>
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary !w-full !py-2.5 flex items-center justify-center gap-2 hover:!text-[var(--brand-primary)] hover:!border-[var(--brand-primary)]"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </aside>

        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 bg-[var(--surface)] border-b border-[var(--line-soft)] flex items-center justify-between px-6 sticky top-0 z-40 w-full shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 -ml-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus:outline-none"
              aria-label="Toggle menu"
            >
              <FiMenu className="text-xl" />
            </button>
            <div className="flex items-center gap-2">
              <FiCheckSquare className="text-[var(--brand-primary)] text-xl" />
              <span className="font-bold text-sm text-[var(--text-primary)]">TaskFlow</span>
            </div>
          </div>
          <button 
            onClick={openProfileModal} 
            className="w-8 h-8 rounded-full bg-[var(--brand-secondary)] text-[var(--text-primary)] font-bold flex items-center justify-center text-xs"
          >
            {initials}
          </button>
        </header>

        {/* Mobile Sidebar Navigation Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-[var(--sidebar-bg)] border-r border-[var(--line-soft)] shadow-xl p-6 transition-transform duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-md shadow-[var(--brand-primary)]/10">
                    <FiCheckSquare className="text-base" />
                  </div>
                  <span className="font-bold text-md text-[var(--text-primary)]">TaskFlow</span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-1 rounded-lg hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]"
                  aria-label="Close menu"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Navigation links inside mobile drawer */}
              <nav className="space-y-1.5 flex-1 overflow-y-auto">
                {renderNavLinks(() => setSidebarOpen(false))}
              </nav>

              {/* Footer inside mobile drawer */}
              <div className="pt-4 border-t border-[var(--line-soft)] mt-4 space-y-3">
                <div className="flex items-center gap-3 p-2">
                  <div className="w-9 h-9 rounded-full bg-[var(--brand-secondary)] text-[var(--text-primary)] font-bold flex items-center justify-center text-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.fullName}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary w-full py-2.5 flex items-center justify-center gap-2"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 w-full flex flex-col">
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
            <Outlet />
          </div>
        </main>

        {/* Profile Modal */}
        <ProfileEditModal
          open={showProfileModal}
          user={dashboardData?.user}
          saving={profileSaving}
          onSave={saveProfile}
          onClose={() => setShowProfileModal(false)}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 bg-[var(--text-primary)] text-[var(--surface)] text-sm px-4 py-2.5 rounded-xl shadow-lg border border-[var(--line-soft)] z-50 animate-slide-in">
            {toast}
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
