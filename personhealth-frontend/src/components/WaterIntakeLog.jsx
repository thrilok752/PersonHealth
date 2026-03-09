import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import api from "../utils/api";
import { FaTrash } from "react-icons/fa";

const WaterIntakeLog = () => {
  const [amount, setAmount] = useState("");
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const response = await api.get("/water-intake/");
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleLog = async () => {
    try {
      if (!amount) return;

      await api.post("/water-intake/", {
        intake_ml: parseInt(amount),
      });

      setAmount("");
      await fetchLogs();
    } catch (error) {
      console.error("Error logging water intake:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/water-intake/${id}/`);
      toast.success("Water intake log deleted!");
      await fetchLogs();
    } catch (error) {
      toast.error("Failed to delete log");
      console.error("Error deleting water intake:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 lg:p-8 w-full h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Water Intake Log</h2>

        <div className="flex items-center gap-3 mb-5">
          <input
            type="number"
            placeholder="Enter water (ml)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button
            onClick={handleLog}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-xl transition"
          >
            Log
          </button>
        </div>

        {logs.length > 0 ? (
          <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200"
              >
                <p className="text-sm sm:text-base text-gray-700">
                  💧 {entry.intake_ml} ml at{" "}
                  <span className="text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </p>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-500 hover:text-red-700 text-lg"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No water intake logged yet.</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default WaterIntakeLog;
