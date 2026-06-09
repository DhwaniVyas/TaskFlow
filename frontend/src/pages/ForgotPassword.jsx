import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err?.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center px-6">
      <div className="card bg-[var(--surface)] p-8 w-full max-w-md border-[var(--line-soft)]">
        <h1 className="page-title text-[var(--text-primary)] mb-2">Forgot Password</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Enter your email to receive a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="name@example.com"
            className="form-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="form-error-msg">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="text-xs mt-4 text-[var(--text-muted)]">
          Back to <Link className="text-[var(--brand-primary)] hover:text-[var(--brand-accent)] font-semibold" to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
