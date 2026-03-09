import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css";  // Import Toastify styles
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Chatbot from "./pages/Chatbot";
import MedicineSearch from "./pages/MedicineSearch";
import NaturalRemedies from "./pages/NaturalRemedies";
import Appointments from "./pages/Appointments";
import ChangePassword from "./pages/ChangePassword";
import Login from "./components/Login";
import Register from "./components/Register";
import HomePage from "./pages/HomePage";
import ForgotPassword from "./pages/ForgotPassword";
// const PrivateRoute = ({ element }) => {
//   return isAuthenticated() ? element : <Navigate to="/login" />;
// };

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const appRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // ✅ Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appRef.current && !appRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
  <Router>
    {isAuthenticated ? (
      // ✅ Authenticated layout
      <div ref={appRef} className="h-screen flex">
        {/* Overlay for sidebar toggle */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${isSidebarOpen ? "block" : "hidden"} lg:hidden`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0 lg:ml-64"}`}>
          <Navbar
  isSidebarOpen={isSidebarOpen}
  toggleSidebar={toggleSidebar}
  setIsAuthenticated={setIsAuthenticated}
/>

          <div className="p-2 mt-16 overflow-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/medicine-search" element={<MedicineSearch />} />
              <Route path="/natural-remedies" element={<NaturalRemedies />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/Home" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/Home" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    ) : (
      // ❌ Not logged in — show only login/register
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

      </Routes>
    )}

    <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
  </Router>
);

}

export default App;

