import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';

const DashboardLayout = lazy(() => import('../pages/dashboard/DashboardLayout'));
const OverviewTab = lazy(() => import('../pages/dashboard/OverviewTab'));
const TasksTab = lazy(() => import('../pages/dashboard/TasksTab'));
const BoardTab = lazy(() => import('../pages/dashboard/BoardTab'));
const CalendarTab = lazy(() => import('../pages/dashboard/CalendarTab'));
const ProfileTab = lazy(() => import('../pages/dashboard/ProfileTab'));
const ComingSoonTab = lazy(() => import('../pages/dashboard/ComingSoonTab'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#0E7490]">Loading...</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
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
            <Route path="board" element={<BoardTab />} />
            <Route path="calendar" element={<CalendarTab />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="analytics" element={<ComingSoonTab />} />
            <Route path="notifications" element={<ComingSoonTab />} />
            <Route path="settings" element={<ComingSoonTab />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
