
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { MapPin, Calendar, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Appointments = () => {
  const token = localStorage.getItem("auth_token");
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const [symptom, setSymptom] = useState("");
  const [location, setLocation] = useState({ lat: "", lng: "" });
  const [searchMode, setSearchMode] = useState("Nearby");
  const [locationText, setLocationText] = useState("");
  const [doctorResults, setDoctorResults] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState({ date: "", time: "" });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [prevPendingIds, setPrevPendingIds] = useState(new Set());
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setNotification({
          message: "Location permission denied. Doctor search needs location access.",
          type: "error",
        });
      }
    );
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: "", type: "" }), 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments/", headers);
      const approved = res.data.filter((appt) => appt.status === "approved");
      const pending = res.data.filter((appt) => appt.status === "pending");
      setApprovedAppointments(approved);
      setPendingAppointments(pending);
      setPrevPendingIds(new Set(pending.map((a) => a.id)));
    } catch {
      setNotification({ message: "Failed to fetch appointments.", type: "error" });
    }
  };

  


  useEffect(() => {
    setLocationText("");
    setDoctorResults([]);
    setSelectedDoctor(null);
  }, [searchMode]);

  useEffect(() => {
    if (!symptom || !location.lat || !location.lng) return;

    const fetchDoctors = async () => {
      setLoading(true);
      setDoctorResults([]);

      try {
        const res = await api.get("/search-doctors-by-symptom/", {
          params: {
            symptom,
            lat: location.lat,
            lng: location.lng,
            mode: searchMode,
            location_text: locationText,
          },
          ...headers,
        });

        const uniqueDoctors = [];
        const seenNames = new Set();
        for (let doc of res.data.doctors || []) {
          if (!seenNames.has(doc.name)) {
            seenNames.add(doc.name);
            uniqueDoctors.push(doc);
          }
        }

        setDoctorResults(uniqueDoctors);
      } catch {
        setNotification({ message: "Error searching doctors.", type: "error" });
      }
      setLoading(false);
    };

    fetchDoctors();
  }, [searchTrigger]);

  const fetchAvailableSlots = async (doctorName, date) => {
    try {
      const res = await api.get("/available-slots/", {
        params: { doctor_name: doctorName, date },
        ...headers,
      });
      setAvailableSlots(res.data.available_slots || []);
    } catch {
      setAvailableSlots([]);
    }
  };

 const handleBook = async () => {
  if (!selectedDoctor || !appointmentDetails.date || !appointmentDetails.time) {
    setNotification({ message: "Please select doctor, date, and time.", type: "error" });
    return;
  }

  const payload = {
    doctor_name: selectedDoctor.name,
    clinic_name: selectedDoctor.clinic,
    clinic_address: selectedDoctor.address,
    specialization: selectedDoctor.specialization,
    date: appointmentDetails.date,
    time: appointmentDetails.time,
  };

  setLoading(true);
  try {
    const res = await api.post("/book-appointment/", payload, headers);

    // ✅ Notify booking request sent
    setNotification({
      message: "⏳ Appointment submitted. Waiting for confirmation...",
      type: "info",
    });

    // ✅ Immediately trigger approval/rejection
    if (res.data.appointment_id) {
      const delayMs = Math.floor(Math.random() * 60000) + 60000; // Random delay between 60s–120s

setTimeout(async () => {
  try {
    const processRes = await api.post(`/process-appointment/${res.data.appointment_id}/`, {}, headers);
    fetchAppointments();

    const msg = processRes.data.status === "approved"
      ? "✅ Appointment approved!"
      : "❌ Appointment rejected.";
    const type = processRes.data.status === "approved" ? "success" : "error";
    setNotification({ message: msg, type });
  } catch {
    setNotification({ message: "Error processing appointment.", type: "error" });
  }
}, delayMs);

    }

    setSelectedDoctor(null);
    setAppointmentDetails({ date: "", time: "" });
    setAvailableSlots([]);
    setTimeout(fetchAppointments, 300);
  } catch (error) {
  console.error("Booking failed:", error.response?.data || error.message);
  setNotification({
    message: error.response?.data?.error || "❌ Booking failed. Please try again.",
    type: "error",
  });
} finally {
    setLoading(false);
  }
};



  const cancelAppointment = async (id) => {
    try {
      await api.delete(`/appointments/${id}/cancel/`, {}, headers);
      await fetchAppointments();
      setNotification({ message: "Appointment canceled.", type: "info" });
    } catch {
      setNotification({ message: "Failed to cancel appointment.", type: "error" });
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 justify-center pt-6 px-6 ">
      <div className="max-w-7xl mx-auto p-6 space-y-8 text-gray-800 font-sans">

        {/* Search */}
        <div>
          <label htmlFor="symptomInput" className="block font-semibold mb-2">
            What symptoms do you have?
          </label>
          <input
            id="symptomInput"
            type="text"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="e.g. fever, headache"
            className="border rounded p-3 w-full mb-4"
          />

          <label htmlFor="searchMode" className="block font-semibold mb-2">
            Search doctors by:
          </label>
          <select
            id="searchMode"
            className="border rounded p-3 w-full mb-4"
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
          >
            <option value="Nearby">Nearby</option>
            <option value="City">By City</option>
            <option value="State">By State</option>
            <option value="India">All India</option>
          </select>

          {searchMode !== "Nearby" && (
            <>
              <label htmlFor="locationInput" className="block font-semibold mb-2">
                Enter {searchMode} name:
              </label>
              <input
                id="locationInput"
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder={`e.g. ${searchMode === "City" ? "Hyderabad" : searchMode === "State" ? "Karnataka" : "India"}`}
                className="border rounded p-3 w-full mb-4"
              />
            </>
          )}

          <button
  onClick={() => setSearchTrigger((prev) => prev + 1)}
  className={`flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded transition ${
    loading ? "opacity-60 cursor-not-allowed" : "hover:bg-indigo-700"
  }`}
  disabled={loading}
>
  {loading ? (
    <>
      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      Searching...
    </>
  ) : (
    "Search Doctors"
  )}
</button>


        </div>

        {/* Doctor Results */}
      {doctorResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">
  {searchMode === "India"
    ? "Doctors Across India"
    : searchMode === "State"
    ? `Doctors in ${locationText || "Selected State"}`
    : searchMode === "City"
    ? `Doctors in ${locationText || "Selected City"}`
    : "Doctors Near You"}
</h2>
<p className="text-sm text-gray-500 mt-1">
  Showing {doctorResults.length} doctor{doctorResults.length !== 1 ? "s" : ""}
</p>

          <div className="grid md:grid-cols-3 gap-6">
            {doctorResults.map((doc) => (
              <div
  key={doc.name}
  className={`border rounded-xl p-4 shadow-md hover:shadow-lg transition transform hover:scale-[1.02] cursor-pointer flex flex-col bg-white relative
    ${
      selectedDoctor && selectedDoctor.name === doc.name
        ? "border-indigo-600 bg-indigo-50"
        : "border-gray-200"
    }`}
  onClick={() => {
    setSelectedDoctor(doc);
    setAppointmentDetails({ date: "", time: "" });
    setAvailableSlots([]);
  }}
>
  <div className="flex items-center gap-4 mb-3">
    <div className="w-12 h-12 bg-green-100 rounded-full overflow-hidden flex items-center justify-center">
  <img
    src={`http://127.0.0.1:8000/media/${doc.photo}`}
    alt="doctor"
    className="w-full h-full object-cover rounded-full"
  />
</div>

    <div>
      <h3 className="text-lg font-semibold text-gray-800">{doc.name}</h3>
      <span className="inline-block mt-1 text-sm px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
        {doc.specialization}
      </span>
    </div>
  </div>

  <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
    <Stethoscope className="w-4 h-4" />
    {doc.clinic || "Clinic info unavailable"}
  </p>
  <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
    <MapPin className="w-4 h-4" />
    {doc.address || "Address info unavailable"}
  </p>

  <button
    className="absolute top-2 right-2 text-xs text-indigo-600 hover:underline"
    onClick={(e) => {
      e.stopPropagation();
      setSelectedDoctor(doc);
    }}
  >
    View
  </button>
</div>

            ))}
          </div>
        </div>
      )}

      {/* Booking Drawer */}
      {/* Floating Appointment Drawer */}
<AnimatePresence>
  {selectedDoctor && (
    <>
      {/* Backdrop */}
      <motion.div
        key="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedDoctor(null)}
        className="fixed inset-0 bg-black z-30"
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-40 bg-white shadow-xl rounded-xl p-6 w-[95%] sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Book Appointment with {selectedDoctor.name}</h3>
          <button onClick={() => setSelectedDoctor(null)} className="text-gray-600 hover:text-red-600 text-xl">
            &times;
          </button>
        </div>

        <label className="block mb-2 font-semibold" htmlFor="dateInput">Select Date</label>
        <input
          id="dateInput"
          type="date"
          className="border rounded p-2 w-full mb-4"
          value={appointmentDetails.date}
          onChange={(e) => {
            setAppointmentDetails((prev) => ({ ...prev, date: e.target.value, time: "" }));
            fetchAvailableSlots(selectedDoctor.name, e.target.value);
          }}
        />

        <label className="block mb-2 font-semibold">Select Time Slot</label>
        {availableSlots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                className={`py-2 rounded border text-sm ${
                  appointmentDetails.time === slot
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50"
                }`}
                onClick={() => setAppointmentDetails((prev) => ({ ...prev, time: slot }))}
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          appointmentDetails.date && <p className="text-gray-500 mb-4">No slots available for this date.</p>
        )}

        <button
          onClick={handleBook}
          className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition w-full"
        >
          Confirm Booking
        </button>
      </motion.div>
    </>
  )}
</AnimatePresence>


      {/* My Appointments */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📁 My Appointments</h2>

        {approvedAppointments.length === 0 && pendingAppointments.length === 0 ? (
          <p className="text-gray-500 text-center">You have no appointments yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Approved */}
            {approvedAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-green-700">✅ Approved</h3>
                <AnimatePresence>
                  {approvedAppointments.map((appt) => (
                    <motion.div
                      key={appt.id}
                      variants={itemVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="bg-white border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{appt.doctor_name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {appt.date} at {appt.time}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Stethoscope className="w-4 h-4" />
                          {appt.clinic_name || "no clinic name"}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {appt.location || "no location"}
                        </p>
                      </div>
                      <button
                        onClick={() => cancelAppointment(appt.id)}
                        className="mt-3 md:mt-0 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pending */}
            {pendingAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-yellow-600">⏳ Pending</h3>
                <AnimatePresence>
                  {pendingAppointments.map((appt) => (
                    <motion.div
                      key={appt.id}
                      variants={itemVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      className="bg-white border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{appt.doctor_name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {appt.date} at {appt.time}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {appt.clinic_name || appt.clinic_address}
                        </p>
                      </div>
                      <button
                        onClick={() => cancelAppointment(appt.id)}
                        className="mt-3 md:mt-0 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {notification.message && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg animate-slide-in
          ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : notification.type === "info"
              ? "bg-yellow-500 text-black"
              : "bg-red-600 text-white"
          }`}
          role="alert"
          aria-live="assertive"
        >
          {notification.message}
        </div>
      )}
      </div>
    </div>
  );
};

export default Appointments;



