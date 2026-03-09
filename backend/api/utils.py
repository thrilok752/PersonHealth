import warnings
from sklearn.exceptions import InconsistentVersionWarning

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
symptom_info_map = {
    # General
    "fever": {"specialist": "General Physician", "severity": "normal"},
    "cold": {"specialist": "General Physician", "severity": "normal"},
    "headache": {"specialist": "General Physician", "severity": "normal"},
    "fatigue": {"specialist": "General Physician", "severity": "normal"},
    "cough": {"specialist": "Pulmonologist", "severity": "normal"},
    "sore throat": {"specialist": "ENT Specialist", "severity": "normal"},
    "flu": {"specialist": "General Physician", "severity": "normal"},
    "nausea": {"specialist": "General Physician", "severity": "normal"},
    "vomiting": {"specialist": "General Physician", "severity": "normal"},
    "diarrhea": {"specialist": "Gastroenterologist", "severity": "normal"},
    "body pain": {"specialist": "General Physician", "severity": "normal"},

    # Respiratory
    "shortness of breath": {"specialist": "Pulmonologist", "severity": "serious"},
    "asthma": {"specialist": "Pulmonologist", "severity": "normal"},
    "chest tightness": {"specialist": "Pulmonologist", "severity": "serious"},

    # Cardiac
    "chest pain": {"specialist": "Cardiologist", "severity": "serious"},
    "heart attack":{"specialist": "Cardiologist", "severity": "serious"},
    "palpitations": {"specialist": "Cardiologist", "severity": "serious"},
    "high blood pressure": {"specialist": "Cardiologist", "severity": "normal"},

    # Mental health
    "depression": {"specialist": "Psychiatrist", "severity": "normal"},
    "anxiety": {"specialist": "Psychiatrist", "severity": "normal"},
    "mental stress": {"specialist": "Psychiatrist", "severity": "normal"},
    "insomnia": {"specialist": "Psychiatrist", "severity": "normal"},

    # Skin
    "skin rash": {"specialist": "Dermatologist", "severity": "normal"},
    "acne": {"specialist": "Dermatologist", "severity": "normal"},
    "eczema": {"specialist": "Dermatologist", "severity": "normal"},
    "itching": {"specialist": "Dermatologist", "severity": "normal"},

    # Eye & Ear
    "eye pain": {"specialist": "Ophthalmologist", "severity": "serious"},
    "blurred vision": {"specialist": "Ophthalmologist", "severity": "serious"},
    "ear pain": {"specialist": "ENT Specialist", "severity": "normal"},
    "hearing loss": {"specialist": "ENT Specialist", "severity": "serious"},

    # Dental
    "toothache": {"specialist": "Dentist", "severity": "normal"},
    "gum bleeding": {"specialist": "Dentist", "severity": "normal"},

    # Stomach & Digestion
    "abdominal pain": {"specialist": "Gastroenterologist", "severity": "normal"},
    "constipation": {"specialist": "Gastroenterologist", "severity": "normal"},
    "gas": {"specialist": "Gastroenterologist", "severity": "normal"},
    "heartburn": {"specialist": "Gastroenterologist", "severity": "normal"},

    # Bones & Joints
    "joint pain": {"specialist": "Orthopedic", "severity": "normal"},
    "back pain": {"specialist": "Orthopedic", "severity": "normal"},
    "knee pain": {"specialist": "Orthopedic", "severity": "normal"},
    "neck pain": {"specialist": "Orthopedic", "severity": "normal"},

    # Women's Health
    "menstrual cramps": {"specialist": "Gynecologist", "severity": "normal"},
    "irregular periods": {"specialist": "Gynecologist", "severity": "normal"},
    "pregnancy": {"specialist": "Gynecologist", "severity": "normal"},

    # Urology
    "frequent urination": {"specialist": "Urologist", "severity": "normal"},
    "painful urination": {"specialist": "Urologist", "severity": "normal"},
    "kidney pain": {"specialist": "Nephrologist", "severity": "serious"},

    # Neurology
    "dizziness": {"specialist": "Neurologist", "severity": "normal"},
    "seizures": {"specialist": "Neurologist", "severity": "serious"},
    "numbness": {"specialist": "Neurologist", "severity": "normal"},
    "paralysis": {"specialist": "Neurologist", "severity": "serious"},

    # Pediatrics
    "child fever": {"specialist": "Pediatrician", "severity": "normal"},
    "child cough": {"specialist": "Pediatrician", "severity": "normal"},
    "child rash": {"specialist": "Pediatrician", "severity": "normal"},

    # Diabetes & Endocrine
    "high blood sugar": {"specialist": "Endocrinologist", "severity": "normal"},
    "thyroid issues": {"specialist": "Endocrinologist", "severity": "normal"},

    # Cancer
    "lump in body": {"specialist": "Oncologist", "severity": "serious"},
    "unexplained weight loss": {"specialist": "Oncologist", "severity": "serious"},

    # General fallback
    "pain": {"specialist": "General Physician", "severity": "normal"},
    "discomfort": {"specialist": "General Physician", "severity": "normal"},
}

def map_symptom_to_specialization_and_severity(symptom: str) -> dict:
    symptom = symptom.lower().strip()
    if symptom in symptom_info_map:
        return symptom_info_map[symptom]
    else:
        # Log unknown symptom for future reference
        with open("unknown_symptoms.log", "a") as log_file:
            log_file.write(f"{symptom}\n")
        return {"specialist": "General Physician", "severity": "normal"}
#------------------------------------------------------------------------------------------------------
import re
import os
import random
import json
import gender_guesser.detector as gender
from genderize import Genderize

# ✅ Set API key for Genderize
Genderize.api_key = "db2fb22c489ea97cff8b6323cf7dc1db"

# ✅ Extract clean first name from full doctor name
def extract_first_name(text):
    text = re.sub(r"\b(Dr|Dr\.|MD|MBBS|DNB|PhD|MRCP|MS|DM|MCh|FRCS)\b", "", text, flags=re.IGNORECASE)
    text = re.sub(r"[^\w\s]", "", text)  # Remove special characters
    text = re.sub(r"\s+", " ", text).strip()
    
    parts = text.split()
    for word in parts:
        if len(word) > 1:
            return word.capitalize()
    
    return parts[0].capitalize() if parts else "Unknown"

# ✅ Load local Indian name-gender dictionary
with open(r"D:/projectmtech/backend/datasets/indian_name_gender_dict.json", encoding="utf-8") as f:
    local_dict = json.load(f)

# ✅ Initialize gender guesser
g_detector = gender.Detector(case_sensitive=False)

# ✅ Hybrid gender detection logic
def detect_gender(name):
    first_name = extract_first_name(name)

    # 1. Try local dictionary
    if first_name in local_dict:
        return local_dict[first_name].lower()

    # 2. Try gender-guesser
    guess = g_detector.get_gender(first_name)
    if guess in ["male", "female", "mostly_male", "mostly_female"]:
        return "male" if "male" in guess else "female"

    # 3. Try Genderize.io
    try:
        result = Genderize().get([first_name])[0]
        if result.get("probability", 0) > 0.85:
            return result["gender"]
    except:
        pass

    return "unknown"

# ✅ Path to static or media folder containing gender images
PHOTO_DIR = r"D:/projectmtech/backend/media"

# ✅ Assign random gender-based photo path
def assign_photo_by_gender(name):
    gender = detect_gender(name)

    if gender == "male":
        folder = os.path.join(PHOTO_DIR, "male")
        gender_folder = "male"
    elif gender == "female":
        folder = os.path.join(PHOTO_DIR, "female")
        gender_folder = "female"
    else:
        folder = os.path.join(PHOTO_DIR, "default")
        gender_folder = "default"

    try:
        images = os.listdir(folder)
        if images:
            selected_image = random.choice(images)
            return f"{gender_folder}/{selected_image}"
    except:
        pass

    # Fallback in case folder is missing or empty
    return "default/default.png"


#-------------------------------------------------------------------------------------------------------------------

import joblib

# Load saved objects
calibrated_rf = joblib.load('api/symptom model/calibrated_rf_model.joblib')
combined = joblib.load('api/symptom model/tfidf_vectorizer_combined.joblib')
le = joblib.load('api/symptom model/label_encoder.joblib')

print("Model and preprocessors loaded successfully!")

def predict_specialist(symptom_text):
    try:
        # Transform text using saved vectorizer
        X_vec = combined.transform([symptom_text])
        # Predict encoded class
        pred_encoded = calibrated_rf.predict(X_vec)
        # Decode class label
        pred_label = le.inverse_transform(pred_encoded)
        return {"specialist": pred_label[0]}
    except Exception as e:
        return {"specialist": f"Unknown (error: {str(e)})"}

# new_symptom = "fever"
# predicted_specialist = predict_specialist(new_symptom)
# print(f"Recommended Specialist: {predicted_specialist}")

#----------------------------------------------------------------------------------------
import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# === STEP 1: Load Your Dataset ===
df = pd.read_excel("datasets/clean_health_tips_no_vague.xlsx")  # Update path as needed

# === STEP 2: Preprocess ===
# Label encode mood
le_mood = LabelEncoder()
df["Mood_Encoded"] = le_mood.fit_transform(df["Mood"])

# Select features to use
features = ['Mood_Encoded', 'Calories', 'Proteins', 'Carbs', 'Fats',
            'Water (ml)', 'Heart Rate (bpm)', 'Steps', 'Sleep (min)']

# Normalize features
scaler = MinMaxScaler()
tip_vectors = scaler.fit_transform(df[features])

# === STEP 3: Function to Predict Best Tip ===
def predict_health_tip(user_input_dict):
    # Convert input to vector
    input_vector = pd.DataFrame([{
        'Mood_Encoded': le_mood.transform([user_input_dict['Mood']])[0],
        'Calories': user_input_dict['Calories'],
        'Proteins': user_input_dict['Proteins'],
        'Carbs': user_input_dict['Carbs'],
        'Fats': user_input_dict['Fats'],
        'Water (ml)': user_input_dict['Water (ml)'],
        'Heart Rate (bpm)': user_input_dict['Heart Rate (bpm)'],
        'Steps': user_input_dict['Steps'],
        'Sleep (min)': user_input_dict['Sleep (min)']
    }])

    # Normalize input
    input_vector_scaled = scaler.transform(input_vector)

    # Cosine similarity with all tips
    similarities = cosine_similarity(input_vector_scaled, tip_vectors)
    best_index = np.argmax(similarities)
    best_tip = df.loc[best_index, "Health Tip"]
    similarity_score = similarities[0][best_index]

    return {
        "tip_index": best_index,
        "similarity_score": round(similarity_score, 4),
        "predicted_tip": best_tip
    }

# # === STEP 4: Example Usage ===
# example_input = {
#     'Mood': 'stressed',
#     'Calories': 2500,
#     'Proteins': 40,
#     'Carbs': 300,
#     'Fats': 80,
#     'Water (ml)': 800,
#     'Heart Rate (bpm)': 110,
#     'Steps': 1200,
#     'Sleep (min)': 320
# }

# result = predict_health_tip(example_input)
# print("Predicted Tip:", result["predicted_tip"])
# print("Similarity Score:", result["similarity_score"])
# print("Tip Index:", result["tip_index"])
