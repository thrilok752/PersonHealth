# Healthcare AI Assistant

An AI-powered healthcare assistant that combines Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and personalized health data to provide intelligent medical question answering, health recommendations, and specialist suggestions.

---

# Project Overview

This system integrates multiple AI components and full-stack technologies to create an intelligent healthcare support platform.

The assistant can:

• Answer general medical questions using BioGPT
• Provide personalized health tips based on user profile data
• Retrieve relevant healthcare information using FAISS vector search
• Recommend medical specialists based on symptoms
• Track user health metrics through a dashboard and mobile app

---

# Key Features

Medical Question Answering
Uses BioGPT model to answer general healthcare questions.

Retrieval-Augmented Generation (RAG)
Combines Gemma LLM with FAISS vector retrieval for profile-aware responses.

Personalized Health Tips
Generates health advice using cosine similarity recommendation models.

Symptom-Based Specialist Prediction
Uses Random Forest classifier to recommend appropriate specialists.

Full Stack System
Includes Django backend, React dashboard, and Android mobile application.

Wearable Mobile Application
can be used in website where we can connect to this application instead of real werable device for stats(sleep,heartrate,steps)

---

# Tech Stack

Backend

* Django
* Django REST Framework
* PostgreSQL
* JWT Authentication

AI / Machine Learning

* BioGPT
* Gemma LLM
* FAISS Vector Search
* Scikit-learn
* Sentence Transformers

Frontend

* React (Vite)
* Tailwind CSS

Mobile

* Android Studio (Java/Kotlin)

Virtual Environment:

* Anaconda

---

# System Architecture

User Interface(Frontend)
Reactjs + tailwind Css

↓

Django REST API Backend + PostgreSql

↓

AI Processing Layer

• BioGPT Medical Q&A
• Gemma RAG Retrieval System
• FAISS Vector Database
• Health Tip Recommendation Model
• Symptom → Specialist Prediction Model

---

# Project Structure

backend/
AI pipelines, Django APIs, ML models

frontend/
React dashboard for user interaction

android_app(Wearable Simulator)/
wearable mobile application(Demo Purpose)

Model Tunning Codes/
Tunning Scripts and Datasets used for tunning



---

# Model Downloads

Large ML models are stored externally to keep the repository lightweight.

BioGPT Model (~1.29GB)
[https://drive.google.com/drive/folders/1tMfOJxfas67CyhDBpOW8HoEcq5ubYmCJ?usp=sharing]

Specialist Recommendation Model based on Symptom (~2.79GB)
[https://drive.google.com/drive/folders/13ik7b64q8jwW1KsD2Tkph2epCWMmKT8e?usp=sharing]

After downloading place them inside:

backend/

---

# Installation

Clone the repository

git clone https://github.com/thrilok752/PersonHealth.git

cd healthcare-ai-assistant

Install backend dependencies

pip install -r requirements.txt

Run Django backend

python manage.py runserver

Run frontend

cd frontend

npm install

npm run dev

---

# Research Paper

the research paper describing this system can be found here:

[https://ijirt.org/publishedpaper/IJIRT184124_PAPER.pdf]

