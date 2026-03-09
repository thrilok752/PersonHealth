import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import api from "../utils/api";
import axios from "axios";

function Navbar({ isSidebarOpen, toggleSidebar, setIsAuthenticated }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error.response);
      }
    };
    if (token) fetchUserProfile();
  }, [token]);

  const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");
    if (!refreshToken || !accessToken) return;

    await axios.post(
      "http://127.0.0.1:8000/api/logout/",
      { refresh: refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Clear tokens and last user
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("lastUsername"); // ✅ Clear last login session

    // Go to login screen without reload
    setIsAuthenticated(false);
    navigate("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-blue-800 text-white p-3 flex justify-between items-center shadow-md fixed top-0 left-0 w-full lg:w-[calc(100%-16rem)] lg:left-64 z-30 transition-all duration-300">
      {/* Sidebar Toggle Button */}
      <button onClick={toggleSidebar} className="lg:hidden text-white">
        <Menu size={28} />
      </button>

      {/* Logo and Title */}
      <div className="flex items-center gap-2">
        <img src="/src/assets/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <h1 className="text-xl font-bold">PersonHealth</h1>
      </div>

      {/* Profile Section with Full Name */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        <span className="text-sm font-medium hidden md:block">{user?.full_name || "User"}</span>
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 focus:outline-none">
          <img
            src={user?.profile_photo ? `http://127.0.0.1:8000${user.profile_photo}` : "/profile-photo.jpg"}
            alt="Profile"
            className="h-10 w-10 rounded-full border object-cover"
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full right-0 w-48 bg-white text-black rounded-lg shadow-md overflow-hidden border border-gray-200 z-50">
            <Link to="/profile" className="block px-4 py-2 hover:bg-gray-200">
              Edit Profile
            </Link>
            <Link to="/change-password" className="block px-4 py-2 hover:bg-gray-200">
              Change Password
            </Link>
            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-200">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
