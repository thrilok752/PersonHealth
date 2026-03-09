import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { Pencil } from "lucide-react";

function Profile() {
  const [user, setUser] = useState({
    full_name: "",
    email: "",
    age: "",
    height: "",
    weight: "",
    gender: "",
    diet_preference: "",
    profile_photo: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    api
      .get("/profile/")
      .then((response) => setUser(response.data))
      .catch((error) => console.error("Profile fetch error:", error));
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("full_name", user.full_name);
    formData.append("age", user.age);
    formData.append("height", user.height);
    formData.append("weight", user.weight);
    formData.append("gender", user.gender);
    formData.append("diet_preference", user.diet_preference);
    if (selectedFile) formData.append("profile_photo", selectedFile);

    await api.put("/profile/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-gray-100">
      <h1 className="text-3xl font-semibold text-center text-green-600 mb-6">
        Your Health Profile
      </h1>

      {/* Top Section: Photo + Name + Email */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 gap-6">
        <div className="relative w-24 h-24">
          <img
            src={
              user?.profile_photo
                ? `http://127.0.0.1:8000${user.profile_photo}`
                : "/profile-photo.jpg"
            }
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-green-300 object-cover cursor-pointer"
            onClick={() => isEditing && fileInputRef.current.click()}
          />
          {isEditing && (
            <div
              className="absolute top-0 right-0 bg-white p-1 rounded-full shadow hover:bg-green-100 cursor-pointer"
              onClick={() => fileInputRef.current.click()}
              title="Change Photo"
            >
              <Pencil className="w-4 h-4 text-green-600" />
            </div>
          )}
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
        </div>

        <div className="flex-1">
          <div className="mb-2">
            <label className="text-sm text-gray-600">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={user.full_name}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Rest of Profile Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Age</label>
          <input
            type="number"
            name="age"
            value={user.age}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Height (cm)</label>
          <input
            type="number"
            name="height"
            value={user.height}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={user.weight}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Gender</label>
          <select
            name="gender"
            value={user.gender}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm text-gray-600">Diet Preference</label>
          <select
            name="diet_preference"
            value={user.diet_preference}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
          >
            <option value="Vegetarian">Veg</option>
            <option value="Non-Vegetarian">Non-Veg</option>
            <option value="Vegan">Vegan</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 text-center">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg"
          >
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

export default Profile;
