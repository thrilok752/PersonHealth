// src/pages/ForgotPassword.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api"; // must be configured with withCredentials: true
import { Link } from "react-router-dom";
const msg = (res, fallback) =>
  res?.data?.message || res?.data?.detail || res?.data?.error || fallback;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);          // 1: email -> 2: otp -> 3: new password
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);  // cooldown in seconds

  // resend cooldown timer
  useEffect(() => {
    if (!resendIn) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // STEP 1: send OTP to email (only advances if proceed === true)
  const handleSendOtp = async () => {
    if (!email) return alert("Enter your registered email");
    if (resendIn > 0) return; // prevent spam clicking
    setLoading(true);
    try {
      const res = await api.post("/auth/password/forgot/send/", { email });
      alert(msg(res, "OTP request processed."));
      if (res?.data?.proceed === true) {
        setStep(2);
        setResendIn(60); // 60s cooldown
      }
    } catch (err) {
      alert(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error sending OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: verify OTP for this email
  const handleVerifyOtp = async () => {
    if (!otp) return alert("Enter the OTP");
    setLoading(true);
    try {
      const res = await api.post("/auth/password/forgot/verify/", { email, otp });
      alert(msg(res, "OTP verified"));
      setStep(3);
    } catch (err) {
      alert(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: set new password (backend uses session-bound verified email)
  const handleResetPassword = async () => {
    if (!newPassword) return alert("Enter a new password");
    setLoading(true);
    try {
      const res = await api.post("/auth/password/forgot/reset/", { new_password: newPassword });
      alert(msg(res, "Password reset successfully. Please log in again."));
      window.location.href = "/login";
    } catch (err) {
      alert(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Error resetting password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>

      {step === 1 && (
        <>
          <label className="block mb-1">Registered Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded mb-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={handleSendOtp}
            disabled={loading || resendIn > 0}
          >
            {loading ? "Sending..." : resendIn ? `Resend in ${resendIn}s` : "Send OTP"}
          </button>
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-blue-600 underline">Back to login</Link>
            </p>
        </>
      )}

      {step === 2 && (
        <>
          <label className="block mb-1">Enter OTP</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-2"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
          />
          <div className="flex gap-2">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <p className="mt-4 text-sm">
            <Link to="/login" className="text-blue-600 underline">Back to login</Link>
            </p>
          </div>
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
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-blue-600 underline">Back to login</Link>
            </p>
        </>
      )}
    </div>
  );
}
