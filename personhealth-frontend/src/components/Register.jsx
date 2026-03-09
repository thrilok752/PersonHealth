import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    age: "",
    height: "",
    weight: "",
    gender: "",
    diet_preference: "",
    profile_photo: null,
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    if (e.target.name === "profile_photo") {
      setFormData({ ...formData, profile_photo: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (formData.full_name.length < 3) {
      errors.full_name = "Full name must be at least 3 characters.";
    }
    if (!/^[A-Za-z ]+$/.test(formData.full_name)) {
      errors.full_name = "Full name must contain only letters and spaces.";
    }
    if (!/^[A-Za-z0-9_]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, and underscores.";
    }
    if (!formData.email.includes("@")) {
      errors.email = "Enter a valid email address.";
    }
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) || !/[\W_]/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase, number, and special character.";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      errors.age = "Age must be between 1 and 120.";
    }
    if (formData.height && (formData.height < 30 || formData.height > 250)) {
      errors.height = "Height must be between 30 cm and 250 cm.";
    }
    if (formData.weight && (formData.weight < 2 || formData.weight > 300)) {
      errors.weight = "Weight must be between 2 kg and 300 kg.";
    }
    if (formData.profile_photo) {
      const fileSize = formData.profile_photo.size / 1024 / 1024;
      const allowedFormats = ["image/jpeg", "image/png"];
      if (fileSize > 2) {
        errors.profile_photo = "File size must be less than 2MB.";
      }
      if (!allowedFormats.includes(formData.profile_photo.type)) {
        errors.profile_photo = "Only JPG and PNG formats are allowed.";
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "profile_photo" && formData[key]) {
        formDataToSend.append(key, formData[key]);
      } else {
        formDataToSend.append(key, String(formData[key]));
      }
    });

    try {
      await api.post("/register/", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      if (error.response?.data) {
        if (error.response.data.username) {
          setErrors({ username: "Username already in use." });
        } else if (error.response.data.email) {
          setErrors({ email: "Email already registered." });
        } else {
          setErrors({ general: "Registration failed. Try again." });
        }
      } else {
        setErrors({ general: "Something went wrong." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-purple-200 px-4 py-6 pt-0 pb-0">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-0">
        <img src="/src/assets/logo.png" alt="Logo" className="h-16 w-16 mb-2" />
        <h1 className="text-3xl font-bold text-blue-700 drop-shadow-md">PersonHealth</h1>
        <p className="text-sm text-gray-600 mt-1">Join your wellness journey</p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-xl border border-gray-200 z-10">
        <h2 className="text-2xl font-semibold text-center text-blue-700 mb-6">Create Your Medical Profile</h2>

        {successMessage && <p className="text-green-600 text-center mb-4">{successMessage}</p>}
        {errors.general && <p className="text-red-600 text-center mb-4">{errors.general}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Full Name</label>
            <input type="text" name="full_name" placeholder="John Doe" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input type="text" name="username" placeholder="john123" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input type="email" name="email" placeholder="john@example.com" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Age</label>
            <input type="number" name="age" placeholder="30" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Height (cm)</label>
            <input type="number" name="height" placeholder="175" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" name="weight" placeholder="70" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Gender</label>
            <select name="gender" onChange={handleChange} className="w-full p-2 border rounded-md bg-white text-sm">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Diet Preference</label>
            <select name="diet_preference" onChange={handleChange} className="w-full p-2 border rounded-md bg-white text-sm">
              <option value="">Select</option>
              <option value="Vegetarian">Veg</option>
              <option value="Non-Vegetarian">Non-Veg</option>
              <option value="Vegan">Vegan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input type="password" name="password" placeholder="********" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
            <input type="password" name="confirmPassword" placeholder="********" onChange={handleChange} className="w-full p-2 border rounded-md text-sm" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Profile Photo</label>
            <input
              type="file"
              name="profile_photo"
              accept="image/png, image/jpeg"
              onChange={handleChange}
              className="w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-white"
            />
            {errors.profile_photo && <p className="text-red-500 text-xs mt-1">{errors.profile_photo}</p>}

            {formData.profile_photo && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(formData.profile_photo)}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-full border"
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
