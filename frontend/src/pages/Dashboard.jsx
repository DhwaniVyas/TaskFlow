import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiCheckSquare, FiFolder, FiBarChart2, FiCheckCircle } from "react-icons/fi";
import { googleLogout } from "@react-oauth/google";
import api from "../api/client";
import { clearToken } from "../utils/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [fullName, setFullName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/dashboard");
        setDashboard(data.data);
        setFullName(data.data.user.fullName);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    api.post("/auth/logout").catch(() => {});
    googleLogout();
    clearToken();
    navigate("/login");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setProfileMessage("");
      const { data } = await api.put("/auth/me", { fullName });
      setDashboard((prev) => ({ ...prev, user: data.data }));
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileMessage(err?.response?.data?.message || "Failed to update profile.");
    }
  };

  if (loading) {
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

  const { user, overview } = dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FA] to-white">
      <header className="border-b border-[#C4E9ED]/50 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5B9EA8] font-semibold">Dashboard</p>
            <h1 className="text-2xl font-bold text-[#082F38]">Welcome, {user.fullName}</h1>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary flex items-center gap-2">
            <FiLogOut /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-4 gap-5">
          <div className="card p-5">
            <p className="text-xs text-[#5B9EA8] mb-2">Total Tasks</p>
            <p className="text-3xl font-bold text-[#082F38] flex items-center gap-2"><FiCheckSquare /> {overview.totalTasks}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-[#5B9EA8] mb-2">Completed Tasks</p>
            <p className="text-3xl font-bold text-[#082F38] flex items-center gap-2"><FiCheckCircle /> {overview.completedTasks}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-[#5B9EA8] mb-2">Active Projects</p>
            <p className="text-3xl font-bold text-[#082F38] flex items-center gap-2"><FiFolder /> {overview.activeProjects}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-[#5B9EA8] mb-2">Productivity Score</p>
            <p className="text-3xl font-bold text-[#082F38] flex items-center gap-2"><FiBarChart2 /> {overview.productivityScore}%</p>
          </div>
        </div>

        <div className="card mt-8 p-6">
          <h2 className="text-xl font-semibold text-[#082F38] mb-2">Account Summary</h2>
          <p className="text-sm text-[#5B9EA8]">Email: {user.email}</p>
          <p className="text-sm text-[#5B9EA8]">Role: {user.role}</p>
          <form onSubmit={handleProfileUpdate} className="mt-5 max-w-md">
            <label className="form-label">Full Name</label>
            <input
              className="form-input w-full mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <button className="btn btn-primary mt-3" type="submit">Update Profile</button>
          </form>
          {profileMessage && <p className="text-sm mt-3 text-[#0E7490]">{profileMessage}</p>}
        </div>
      </main>
    </div>
  );
}
