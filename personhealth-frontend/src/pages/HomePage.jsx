import React, { useEffect, useState } from "react";
import api from "../utils/api";
import logo from "../assets/logo.png";
import logo25 from "../assets/logo25.png";

const Home = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("accessToken");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quote, setQuote] = useState("");

  const quotes = [
    "Your health is your true wealth.",
    "Small steps today make a big difference tomorrow.",
    "Stay hydrated, stay happy!",
    "A healthy outside starts from the inside."
  ];

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

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString();
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "🌅 Good Morning";
    if (hour >= 12 && hour < 17) return "☀️ Good Afternoon";
    if (hour >= 17 && hour < 21) return "🌇 Good Evening";
    return "🌙 Good Night";
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-100 via-blue-100 to-purple-200 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-6 sm:p-10 w-full max-w-2xl text-center animate-fade-in">
        <img
          src={logo}
          alt="Logo"
          className="w-20 h-20 mx-auto mb-4 rounded-full shadow-md"
        />
        <h2 className="text-2xl font-semibold text-gray-500 mb-1">{getGreeting()}</h2>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
          Welcome, <span className="text-blue-600">{user?.full_name || 'Health Explorer'}</span>!
        </h1>
        <p className="text-xl text-gray-600 italic mb-4">“{quote}”</p>
        <p className="text-md text-gray-500">{formattedDate}</p>
        <p className="text-lg font-medium text-gray-700">{formattedTime}</p>
        <img
          src={logo25}
          alt="Health"
          className="w-28 sm:w-36 mx-auto mt-6"
        />
      </div>
    </div>
  );
};

export default Home;
