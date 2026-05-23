import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/auth/reset-password", { token, password });
      setMessage(data.message);
    } catch (err) {
      setError(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#F0F9FA] via-white to-[#FFE4D6]/20 flex items-center justify-center px-6">
      <div className="card bg-white p-8 w-full max-w-md">
        <h1 className="page-title mb-2">Reset Password</h1>
        <p className="text-sm text-[#5B9EA8] mb-6">Set a new password for your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="form-input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="form-input w-full"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="form-error-msg">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button className="btn btn-accent w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <p className="text-xs mt-4 text-[#5B9EA8]">
          Back to <Link className="text-[#0E7490] font-semibold" to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
