// src/pages/ChangePasswordOtpOnly.jsx
import React, { useState } from "react";
import api from "../utils/api";

const pick = (r, fb) => r?.data?.message || r?.data?.detail || r?.data?.error || fb;

export default function ChangePasswordOtpOnly() {
  const [step, setStep] = useState(1); // 1 send otp -> 2 verify -> 3 new pwd
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const authCfg = () => {
    const t = localStorage.getItem("accessToken");
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {};
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/password/change/send-otp/", {}, authCfg());
      alert(pick(res, "OTP sent to your email"));
      if (res?.data?.proceed !== false) setStep(2);
    } catch (e) {
      alert(pick(e.response, "Error sending OTP"));
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");
    setLoading(true);
    try {
      const res = await api.post("/auth/password/change/verify-otp/", { otp }, authCfg());
      alert(pick(res, "OTP verified"));
      setStep(3);
    } catch (e) {
      alert(pick(e.response, "Invalid or expired OTP"));
    } finally { setLoading(false); }
  };

  const confirmNew = async () => {
    if (!newPassword) return alert("Enter new password");
    setLoading(true);
    try {
      const res = await api.post("/auth/password/change/confirm/", { new_password: newPassword }, authCfg());
      alert(pick(res, "Password changed. Please log in again."));
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    } catch (e) {
      alert(pick(e.response, "Error updating password"));
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Change Password</h1>

      {step === 1 && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={sendOtp}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send OTP to Email"}
        </button>
      )}

      {step === 2 && (
        <>
          <label className="block mb-1">Enter OTP</label>
          <input
            className="w-full p-2 border rounded mb-2"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={verifyOtp}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded mb-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={confirmNew}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </>
      )}
    </div>
  );
}
