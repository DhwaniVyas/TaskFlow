import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { setToken } from "../utils/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setError("Missing verification token");
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setToken(data.data.token);
        setMessage("Email verified successfully. You can now open your dashboard.");
      } catch (err) {
        setError(err?.response?.data?.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center px-6">
      <div className="card bg-[var(--surface)] border-[var(--line-soft)] p-8 w-full max-w-md text-center">
        <h1 className="page-title text-[var(--text-primary)] mb-4">Email Verification</h1>
        {loading && <p className="text-[var(--brand-primary)]">Verifying your email...</p>}
        {!loading && error && <p className="form-error-msg">{error}</p>}
        {!loading && message && <p className="text-green-700 text-sm">{message}</p>}
        {!loading && (
          <div className="mt-6">
            <Link className="btn btn-primary" to="/dashboard">Go to Dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
}
