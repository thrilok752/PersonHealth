import React from "react";
import { Link } from "react-router-dom";
import { Home, Search, Book, Calendar, X,LayoutDashboard,BotMessageSquare} from "lucide-react";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-blue-100 text-grey-800 transition-transform duration-300 z-50 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-64"
      } lg:translate-x-0`}
    >
      {/* Close Button (Only in Mobile Mode) */}
      <button onClick={toggleSidebar} className="absolute top-4 right-4 text-white lg:hidden">
        <X size={24} />
      </button>

      {/* Sidebar Menu */}
      <div className="p-5">
        <img src="/src/assets/logo.png" alt="Logo" className="h-20 w-20 object-contain rounded-full border-2 border-gray-500 mx-auto bg-stone-400" />
        <ul>
          
          <li>
            <Link to="/Home" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded hover:text-blue-600 transition-colors duration-200">
              <Home size={20} />
              Home
            </Link>
          </li>
          <li>
            <Link to="/chatbot" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded hover:text-blue-600 transition-colors duration-200">
              <BotMessageSquare size={20} />
              Chatbot Assistant
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded hover:text-blue-600 transition-colors duration-200">
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/medicine-search" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded hover:text-blue-600 transition-colors duration-200">
              <Search size={20} />
              Medicine Search
            </Link>
          </li>
          <li>
            <Link to="/natural-remedies" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded hover:text-blue-600 transition-colors duration-200">
              <Book size={20} />
              Natural Remedies
            </Link>
          </li>
          <li>
            <Link to="/appointments" className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded hover:text-blue-600 transition-colors duration-200">
              <Calendar size={20} />
              Appointments
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
