import React, { useState, useEffect } from "react";
import { useNavigate,Link } from "react-router-dom";
import api from "../utils/api";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [showFullForm, setShowFullForm] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      const savedUser = localStorage.getItem("lastUsername");
      if (savedUser) {
        setLastUser(savedUser);
        setShowFullForm(false);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login/", formData);
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      localStorage.setItem("lastUsername", formData.username);
      setIsAuthenticated(true);
      navigate("/home");
    } catch (error) {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAs = async () => {
    if (!lastUser || !formData.password) {
      setError("Please enter your password to continue.");
      return;
    }
    try {
      const response = await api.post("/login/", { username: lastUser, password: formData.password });
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      setIsAuthenticated(true);
      navigate("/home");
    } catch {
      setError("Incorrect password for saved user. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-purple-200 relative overflow-hidden">
      {/* Logo + Title */}
      <div className="absolute top-6 flex flex-col items-center">
        <img src="/src/assets/logo.png" alt="Logo" className="h-16 w-16 mb-2" />
        <h1 className="text-3xl font-bold text-blue-700 drop-shadow-md">PersonHealth</h1>
        <p className="text-sm text-gray-600 mt-1">Empowering your wellness journey</p>
      </div>

      {/* Register Box */}
      <div className="mt-32 relative w-96 p-6 bg-white shadow-2xl shadow-blue-100 rounded-lg border border-gray-300">
        <div className="absolute inset-0 bg-cover bg-center opacity-10 rounded-lg" style={{ backgroundImage: "url('src/assets/logo.png')" }}></div>
        <h2 className="text-2xl font-bold text-center mb-4 relative">Login to PersonHealth</h2>
        {error && <p className="text-red-600 text-center relative">{error}</p>}

        {!showFullForm && lastUser ? (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 relative">
            <p className="text-sm text-center">Welcome back, <strong>{lastUser}</strong></p>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleContinueAs} className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600">
              {loading ? "Logging in..." : `Continue as ${lastUser}`}
            </button>
            <p className="text-center mt-4 relative">
              <button type="button" onClick={() => setShowFullForm(true)} className="text-blue-500 hover:underline">
                Log in with a different account
              </button>
            </p>
            <p className="text-center mt-4 relative">
              <Link to="/forgot-password" className="text-sm text-blue-600 underline">Forgot password?</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition">
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="text-center mt-4 relative">
              Don't have an account? <a href="/register" className="text-blue-500 hover:underline">Register</a>
            </p>
            <p className="text-center mt-4 relative">
              <Link to="/forgot-password" className="text-sm text-blue-600 underline">Forgot password?</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
