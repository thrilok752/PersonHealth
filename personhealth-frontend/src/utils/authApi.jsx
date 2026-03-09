// src/services/authApi.js
import api from "../utils/api";

// PRE-LOGIN (forgot)
export const fpSend   = (email)           => api.post("/auth/password/forgot/send/",   { email });
export const fpVerify = (email, otp)      => api.post("/auth/password/forgot/verify/", { email, otp });
export const fpReset  = (new_password)    => api.post("/auth/password/forgot/reset/",  { new_password });

// POST-LOGIN (change with OTP) — include Authorization header where you set up api
export const cpSendOtp   = (current_password) => api.post("/auth/password/change/send-otp/",   { current_password });
export const cpVerifyOtp = (otp)              => api.post("/auth/password/change/verify-otp/", { otp });
export const cpConfirm   = (new_password)     => api.post("/auth/password/change/confirm/",    { new_password });
