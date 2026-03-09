import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { Loader2} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from '../components/card';

const HealthTipCard = ({ wearableData }) => {
  const [tip, setTip] = useState("Your AI health tip will appear here.");
  const [loading, setLoading] = useState(false);
  const cardStyle = "w-full h-full rounded-2xl shadow-md bg-gradient-to-br from-green-50 to-blue-100";


  const fetchTip = async () => {
    setLoading(true);
    try {
      const [moodRes, nutritionRes, waterRes] = await Promise.all([
        api.get("/mood/"),
        api.get("/nutrition/today-summary/"),
        api.get("/water-intake/summary/"),
      ]);

      const recentMood = moodRes.data?.recent_moods?.[0]?.mood || "neutral";
      const summary = nutritionRes.data?.summary || {};
      const water = waterRes.data?.total_water_ml || 0;

      const payload = {
        Mood: recentMood,
        Calories: summary.calories || 0,
        Proteins: summary.protein || 0,
        Carbs: summary.carbs || 0,
        Fats: summary.fats || 0,
        "Water (ml)": water,
        "Heart Rate (bpm)": wearableData.heartRate || 0,
        Steps: wearableData.steps || 0,
        "Sleep (min)": wearableData.sleep || 0,
      };

      const tipRes = await api.post("/predict-health-tip/", payload);
      setTip(tipRes.data.tip || "No tip generated.");
    } catch (error) {
      console.error("Error generating health tip:", error);
      setTip("⚠️ Failed to fetch health tip.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, [wearableData]);

  return (
    <Card className="w-full h-full rounded-2xl shadow-md bg-gradient-to-br from-green-50 to-blue-100">
  <CardContent className="p-6 sm:p-8 h-full flex flex-col justify-between space-y-4">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🧠 Health Tip</h2>

    <motion.div
      key={tip}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-gray-700 text-base sm:text-lg italic flex-grow min-h-[100px]"
    >
      {loading ? (
        <span className="flex items-center gap-2 text-blue-600">
          <Loader2 className="animate-spin" size={20} /> Generating tip...
        </span>
      ) : (
        tip
      )}
    </motion.div>

    <button
      onClick={fetchTip}
      className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition"
    >
      Refresh Tip
    </button>
  </CardContent>
</Card>
  );
};

export default HealthTipCard;
