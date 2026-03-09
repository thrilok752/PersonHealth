// src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { symptomList } from "../assets/symptomList_clean_95";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("Mild");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (symptom.trim() === "") {
      setFilteredOptions([]);
      return;
    }
    const lower = symptom.toLowerCase();
    const results = symptomList.filter((item) =>
      item.Symptom.toLowerCase().startsWith(lower)
    );
    setFilteredOptions(results.slice(0, 6));
  }, [symptom]);

  const addTypingIndicator = () => {
    setMessages((prev) => [...prev, { text: "•••", sender: "bot", temp: true }]);
  };

  const replaceTypingWithBotReply = (text) => {
    setMessages((prev) => [
      ...prev.filter((msg) => !msg.temp),
      { text, sender: "bot" },
    ]);
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowInfoBox(true);
    addTypingIndicator();

    try {
      const res = await api.post("/chatbot/", {
        mode,
        type: "text",
        message: input,
      });
      replaceTypingWithBotReply(res.data.response);
    } catch {
      replaceTypingWithBotReply("Something went wrong.");
    }
  };

  const handleSubmitSymptom = async () => {
    const fields = { symptom, severity, duration, description };
    const promptText = `Symptom: ${symptom}\nSeverity: ${severity}\nDuration: ${duration}\nDescription: ${description}`;
    setMessages((prev) => [...prev, { text: promptText, sender: "user" }]);
    setShowInfoBox(true);
    addTypingIndicator();

    try {
      const res = await api.post("/chatbot/", {
        mode,
        type: "form",
        fields,
      });
      replaceTypingWithBotReply(res.data.response);
      setIsTrackerOpen(false);
      setSymptom("");
      setSeverity("Mild");
      setDuration("");
      setDescription("");
    } catch {
      replaceTypingWithBotReply("Error sending symptom data.");
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setShowInfoBox(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 sm:px-6 bg-gradient-to-br from-green-100 via-blue-50 to-purple-100">
      <div className="p-6 max-w-4xl w-full mx-auto">
        <div className="mb-4 flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => setMode("general")}
            className={`px-4 py-2 rounded-full border transition ${
              mode === "general"
                ? "bg-blue-600 text-white"
                : "bg-white text-blue-600 border-blue-600"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setMode("personalised")}
            className={`px-4 py-2 rounded-full border transition ${
              mode === "personalised"
                ? "bg-green-600 text-white"
                : "bg-white text-green-600 border-green-600"
            }`}
          >
            Personalised
          </button>
        </div>

        {showInfoBox && messages.length > 0 && (
          <div className="bg-white border border-gray-200 shadow rounded p-4 mb-4 text-gray-700 text-sm">
            {mode === "general"
              ? "General mode: Chatbot will answer using general health knowledge. Symptom form uses basic symptom-only understanding."
              : "Personalised mode: Chatbot will consider your profile. Symptom form uses symptom + profile logic for tailored advice."}
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex flex-col overflow-y-auto max-h-[55vh] sm:max-h-[60vh] bg-gray-50 p-4 rounded shadow-md">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow ${
                  msg.sender === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : msg.temp
                    ? "mr-auto bg-gray-300 text-gray-700 italic animate-pulse"
                    : "mr-auto bg-white text-gray-900"
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch gap-2 mt-4">
          <div className="flex sm:flex-1 gap-2">
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full"
            >
              +
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded shadow"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              Send
            </button>
            <button
              onClick={clearMessages}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              Clear
            </button>
          </div>
        </div>

        {isTrackerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md sm:w-[22rem]">
              <h2 className="text-xl font-semibold mb-4 text-blue-700">Symptom Tracker</h2>
              <div className="relative mb-2">
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Search symptom"
                  value={symptom}
                  onChange={(e) => {
                    setSymptom(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filteredOptions.length > 0 && (
                  <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-40 overflow-y-auto">
                    {filteredOptions.map((item) => (
                      <li
                        key={item.ID}
                        className="p-2 hover:bg-blue-100 cursor-pointer"
                        onClick={() => {
                          setSymptom(item.Symptom);
                          setShowDropdown(false);
                        }}
                      >
                        {item.Symptom}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <select
                className="w-full p-2 border rounded mb-2"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
              <input
                type="text"
                className="w-full p-2 border rounded mb-2"
                placeholder="Duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <textarea
                className="w-full p-2 border rounded mb-2"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    handleSubmitSymptom();
                    setIsTrackerOpen(false);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>

                <button
                  onClick={() => setIsTrackerOpen(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chatbot;
