import React, { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import MoodTracker from "../components/MoodTracker";
import WaterIntakeLog from "../components/waterintakelog";
import NutritionLogger from "../components/NutritionLogger";
import WellnessQuote from "../components/WellnessQuote";
import HealthMetrics from "../components/HealthMetrics";
import HealthTipCard from "../components/HealthTipCard";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import { Sparkles } from "lucide-react";

const Dashboard = () => {
  const [wearableData, setWearableData] = useState({ heartRate: 0, steps: 0, sleep: 0, bmi: null, weight: null });
  const [trendData, setTrendData] = useState({
    heartRate: { labels: [], values: [] },
    steps: { labels: [], values: [] },
    sleep: { labels: [], values: [] },
    bmi: { labels: [], values: [] },
    weight: { labels: [], values: [] }
  });

  const [deviceConnected, setDeviceConnected] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [isHeartRateHigh, setIsHeartRateHigh] = useState(false);

  const deviceRef = useRef(null);
  const keepPollingRef = useRef(true);

  useEffect(() => {
    fetchUserProfile();
    fetchAllTrends();
  }, []);

  const fetchUserProfile = async () => {
  try {
    const response = await api.get("/profile/");
    const { height, weight } = response.data;

    if (height > 0 && weight > 0) {
      const bmiValue = (weight / ((height / 100) ** 2)).toFixed(1);
      setWearableData((prev) => ({ ...prev, bmi: bmiValue, weight }));

      // ✅ Post BMI and Weight to backend for trend tracking
      await postMetric({
        bmi: parseFloat(bmiValue),
        weight: parseFloat(weight)
      });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
};

  const fetchTrendData = async (type) => {
    try {
      const res = await api.get(`/metrics/trend/?type=${type}&days=7`);
      return res.data;
    } catch (error) {
      console.error(`Error fetching ${type} trend:`, error);
      return { labels: [], values: [] };
    }
  };

  const fetchAllTrends = async () => {
    const types = ["heart_rate", "steps", "sleep_duration", "bmi", "weight"];
    const trendKeys = ["heartRate", "steps", "sleep", "bmi", "weight"];

    for (let i = 0; i < types.length; i++) {
      const data = await fetchTrendData(types[i]);
      setTrendData((prev) => ({ ...prev, [trendKeys[i]]: data }));
    }
  };

  const postMetric = async (data) => {
    try {
      await api.post("/add-metric/", data);
    } catch (err) {
      console.error("❌ Failed to POST metric:", err);
    }
  };

 const readCharValue = async (char) => {
  try {
    const val = await char.readValue();
    const uuid = char.uuid.toLowerCase();

    if (uuid.includes("2a37")) {
      // Heart rate: Byte 0 = flags, Byte 1 = HR value
      return val.byteLength >= 2 ? val.getUint16(0, true) : (val.byteLength === 1 ? val.getUint8(0) : 0);

    } else if (uuid.includes("2a78") || uuid.includes("2a7a")) {
      // Steps or Sleep: expect 2-byte value
      return val.byteLength >= 2 ? val.getUint16(0, true) : (val.byteLength === 1 ? val.getUint8(0) : 0);
    } else {
      // Generic fallback
      return val.byteLength >= 2 ? val.getUint16(0, true) : (val.byteLength === 1 ? val.getUint8(0) : 0);
    }
  } catch (e) {
    console.warn("⚠️ Read error for", char?.uuid, e);
    return null;
  }
};

  const connectWearable = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["00001810-0000-1000-8000-00805f9b34fb"] }],
        optionalServices: ["00001810-0000-1000-8000-00805f9b34fb"]
      });

      const server = await device.gatt.connect();
      deviceRef.current = device;
      setDeviceConnected(true);

      device.ongattserverdisconnected = () => {
        console.warn("🔌 Disconnected from wearable.");
        disconnectDevice();
      };

      const service = await server.getPrimaryService("00001810-0000-1000-8000-00805f9b34fb");

      const heartChar = await service.getCharacteristic("00002a37-0000-1000-8000-00805f9b34fb");
      const stepsChar = await service.getCharacteristic("00002a78-0000-1000-8000-00805f9b34fb");
      const sleepChar = await service.getCharacteristic("00002a7a-0000-1000-8000-00805f9b34fb");

      keepPollingRef.current = true;

      while (keepPollingRef.current) {
        const heartRate = await readCharValue(heartChar);
        const steps = await readCharValue(stepsChar);
        const sleep = await readCharValue(sleepChar);

        const timestamp = new Date().toISOString();

        setWearableData(prev => ({
          ...prev,
          heartRate: heartRate ?? prev.heartRate,
          steps: steps ?? prev.steps,
          sleep: sleep ?? prev.sleep,
        }));

        if (heartRate !== null || steps !== null || sleep !== null) {
  const payload = {
    ...(heartRate !== null && { heart_rate: heartRate }),
    ...(steps !== null && { steps }),
    ...(sleep !== null && sleep >= 30 && { sleep_duration: sleep })  // ✅ Only send sleep if at least 30 mins (1800 seconds)
  };
  postMetric(payload);
}


        if (heartRate > 120) setIsHeartRateHigh(true);

        await new Promise(res => setTimeout(res, 2000));
      }
    } catch (error) {
      console.error("❌ Error connecting to wearable:", error);
    }
  };

  const disconnectDevice = () => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
      console.log("📴 Manual or auto disconnect successful");
    }
    keepPollingRef.current = false;
    setDeviceConnected(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 px-4 py-6 overflow-x-hidden">
      <div className="w-full max-w-[90rem] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Your Health Dashboard</h1>
          <button
            onClick={deviceConnected ? disconnectDevice : connectWearable}
            className={`px-5 py-2 rounded-xl font-medium w-full sm:w-auto text-white ${
              deviceConnected ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {deviceConnected ? "Disconnect Device" : "Connect Device"}
          </button>
        </div>

        <div className="mb-10">
          <HealthMetrics
            wearableData={wearableData}
            onMetricClick={setSelectedTrend}
            heartAlert={isHeartRateHigh}
          />
        </div>

        <div className="mb-12 bg-white shadow rounded-2xl p-6 w-full">
          {selectedTrend && (
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {selectedTrend === "heartRate" && "Heart Rate Trend"}
              {selectedTrend === "steps" && "Steps Trend"}
              {selectedTrend === "sleep" && "Sleep Trend"}
              {selectedTrend === "bmi" && "BMI Trend"}
              {selectedTrend === "weight" && "Weight Trend"}
            </h2>
          )}

          <div className="w-full aspect-[2/1] sm:aspect-[3/1] relative rounded-xl overflow-hidden bg-gray-50">
            {selectedTrend ? (
              <div className="absolute inset-0">
                {selectedTrend === "heartRate" && (
                  <Line data={{ labels: trendData.heartRate.labels, datasets: [{ label: "Heart Rate (BPM)", data: trendData.heartRate.values, borderColor: "#EF4444", tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
                {selectedTrend === "steps" && (
                  <Bar data={{ labels: trendData.steps.labels, datasets: [{ label: "Steps", data: trendData.steps.values, backgroundColor: "#3B82F6" }] }} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
                {selectedTrend === "sleep" && (
                  <Line data={{ labels: trendData.sleep.labels, datasets: [{ label: "Sleep Hours", data: trendData.sleep.values, borderColor: "#8B5CF6", tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
                {selectedTrend === "bmi" && (
                  <Line data={{ labels: trendData.bmi.labels, datasets: [{ label: "BMI", data: trendData.bmi.values, borderColor: "#F59E0B", tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
                {selectedTrend === "weight" && (
                  <Line data={{ labels: trendData.weight.labels, datasets: [{ label: "Weight (kg)", data: trendData.weight.values, borderColor: "#10B981", tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false }} />
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-400 animate-pulse">
                <Sparkles className="w-10 h-10 mb-3 text-blue-400" />
                <p className="text-sm italic">Click a health metric to view your trend</p>
              </div>
            )}
          </div>
        </div>

       <div className="grid grid-cols-12 gap-6 mb-10">
  {/* First Row – 3 Cards */}
  <div className="col-span-12 sm:col-span-6 xl:col-span-4">
    <MoodTracker />
  </div>
  <div className="col-span-12 sm:col-span-6 xl:col-span-4">
    <NutritionLogger />
  </div>
  <div className="col-span-12 sm:col-span-6 xl:col-span-4">
    <WaterIntakeLog />
  </div>

  {/* Second Row – 2 Cards of Equal Width */}
  <div className="col-span-12 sm:col-span-6 xl:col-span-6">
    <HealthTipCard wearableData={wearableData} />
  </div>
  <div className="col-span-12 sm:col-span-6 xl:col-span-6">
    <WellnessQuote />
  </div>
</div>

      </div>
    </div>
  );
};

export default Dashboard;
