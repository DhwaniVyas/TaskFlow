import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import { isAuthenticated } from '../utils/auth';

const DashboardLayout = lazy(() => import('../pages/dashboard/DashboardLayout'));
const OverviewTab = lazy(() => import('../pages/dashboard/OverviewTab'));
const TasksTab = lazy(() => import('../pages/dashboard/TasksTab'));
const ProjectsTab = lazy(() => import('../pages/dashboard/ProjectsTab'));
const AnalyticsTab = lazy(() => import('../pages/dashboard/AnalyticsTab'));
const ProfileTab = lazy(() => import('../pages/dashboard/ProfileTab'));

function LandingRedirect() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#0E7490]">Loading...</div>}>
      <Routes>
        <Route path="/" element={<LandingRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<OverviewTab />} />
            <Route path="tasks" element={<TasksTab />} />
            <Route path="projects" element={<ProjectsTab />} />
            <Route path="board" element={<Navigate to="/dashboard/tasks?view=board" replace />} />
            <Route path="calendar" element={<Navigate to="/dashboard/tasks?view=calendar" replace />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="analytics" element={<AnalyticsTab />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
