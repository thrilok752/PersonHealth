import React from "react";

const metrics = [
  { key: "heartRate", label: "Heart Rate", unit: "bpm", baseColor: "text-red-500" },
  { key: "steps", label: "Steps", unit: "", baseColor: "text-blue-500" },
  { key: "sleep", label: "Sleep", unit: "min", baseColor: "text-purple-500" },
  { key: "bmi", label: "BMI", unit: "", baseColor: "text-amber-500" },
  { key: "weight", label: "Weight", unit: "kg", baseColor: "text-emerald-500" },  // ✅ Added
];


const HealthMetrics = ({ wearableData, onMetricClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map(({ key, label, unit, baseColor }) => {
        const value = wearableData[key];
        const isHeartRate = key === "heartRate";
        const isHighHR = isHeartRate && value > 120;

        return (
          <div
            key={key}
            onClick={() => onMetricClick(key)}
            className={`rounded-2xl p-5 sm:p-6 shadow transition duration-300 cursor-pointer
              ${isHighHR ? "bg-red-100 border-red-500 border-2 animate-pulse" : "bg-white hover:shadow-md"}
            `}
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p
              className={`text-2xl sm:text-3xl font-bold mt-1 ${
                isHighHR ? "text-red-600" : baseColor
              }`}
            >
              {value !== null && value !== undefined ? `${value} ${unit}` : "--"}
            </p>
            {isHighHR && (
              <p className="text-xs text-red-600 mt-1">⚠️ High Heart Rate</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HealthMetrics;
