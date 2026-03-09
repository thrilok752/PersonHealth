import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";

const moodEmojiMap = {
  happy: "😊",
  sad: "😢",
  stressed: "😰",
  angry: "😠",
  neutral: "😐",
};

const tipColorMap = {
  happy: "text-green-600",
  sad: "text-blue-600",
  stressed: "text-yellow-700",
  angry: "text-red-600",
  neutral: "text-gray-600",
};

const MoodTracker = () => {
  const [mood, setMood] = useState("");
  const [suggestion, setSuggestion] = useState("Your AI health tip will appear here.");
  const [recentMoods, setRecentMoods] = useState([]);
  const [tipMood, setTipMood] = useState("");

  const handleMoodSubmit = async () => {
    if (!mood) return;

    try {
      const response = await api.post("/mood/", { mood });
      setSuggestion(response.data.suggestion || "Stay positive!");
      setTipMood(mood);
      setMood("");
      fetchRecentMoods();
    } catch (error) {
      console.error("Error submitting mood", error);
    }
  };

  const fetchRecentMoods = async () => {
    try {
      const response = await api.get("/mood/");
      setRecentMoods(response.data.recent_moods || []);
    } catch (error) {
      console.error("Error fetching recent moods", error);
    }
  };

  useEffect(() => {
    fetchRecentMoods();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 lg:p-8 w-full h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Mood Tracker</h2>

        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">😶 Select Mood</option>
          <option value="happy">😊 Happy</option>
          <option value="sad">😢 Sad</option>
          <option value="stressed">😰 Stressed</option>
          <option value="angry">😠 Angry</option>
          <option value="neutral">😐 Neutral</option>
        </select>

        <button
          onClick={handleMoodSubmit}
          disabled={!mood}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition disabled:opacity-50"
        >
          Submit Mood
        </button>

        <AnimatePresence>
          {suggestion && (
            <motion.p
              key={suggestion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={`mt-4 text-center font-semibold text-base sm:text-lg ${tipColorMap[tipMood] || "text-gray-700"}`}
            >
              {suggestion}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {recentMoods.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-700 mb-2">🕓 Recent Mood History</h3>
          <ul className="space-y-2 text-gray-700 text-sm sm:text-base max-h-40 overflow-y-auto pr-1">
            {recentMoods.map((entry, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {moodEmojiMap[entry.mood]}{" "}
                {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)} —{" "}
                <span className="text-gray-500">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;
