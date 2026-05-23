import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../api/client";
import { setToken } from "../../utils/auth";

export default function GoogleAuthButton({ onSuccess, onError, setLoading }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="text-xs text-[#DC2626]">
        Google sign-in is unavailable. Missing `VITE_GOOGLE_CLIENT_ID`.
      </p>
    );
  }

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading?.(true);
      const credential = credentialResponse?.credential;
      if (!credential) {
        throw new Error("Google credential missing");
      }
      const { data } = await api.post("/auth/google", { credential });
      setToken(data.data.token);
      onSuccess?.(data);
    } catch (err) {
      onError?.(err?.response?.data?.message || "Google login failed");
    } finally {
      setLoading?.(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => onError?.("Google sign-in popup was closed or failed")}
        width="320"
      />
    </div>
  );
}
