import os, sys
from pathlib import Path

# >>> CHANGE THIS to your backend project root folder that contains the "api" package <<<
PROJECT_ROOT = Path("D:/projectmtech/backend").resolve()
INDEX_PATH = PROJECT_ROOT / "api" / "symptom_index.faiss"
DATA_PATH  = PROJECT_ROOT / "api" / "symptom_data.pkl"

ip=PROJECT_ROOT / "api" / "symptom_profile_index.faiss"
dp=PROJECT_ROOT / "api" / "symptom_profile_data.pkl"

IP=PROJECT_ROOT /"api" / "profile_index.faiss"
DP=PROJECT_ROOT /"api" / "profile_data.pkl"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# If you need Django models/settings anywhere, also set DJANGO_SETTINGS_MODULE:
# os.environ.setdefault("DJANGO_SETTINGS_MODULE", "yourproject.settings")

# Now regular imports work:
from api.rag_helper import query_rag,query_rag_profile,_strip_profile_numbers  # etc.
def run_rag_symptom_only(fields):
    symptom     = (fields.get('symptom') or '').strip()
    severity    = (fields.get('severity') or '').strip()
    duration    = (fields.get('duration') or '').strip()
    description = (fields.get('description') or '').strip()

    current_q = f"Symptom: {symptom}, Severity: {severity}, Duration: {duration}, Description: {description}."
    return query_rag(
        input_text=current_q,
        index_path=str(INDEX_PATH),
        data_path=str(DATA_PATH),
        top_k=5,
    )

def run_rag_symptom_profile(fields, user):
    symptom     = (fields.get('symptom') or '').strip()
    severity    = (fields.get('severity') or '').strip()
    duration    = (fields.get('duration') or '').strip()
    description = (fields.get('description') or '').strip()

    question = f"Symptom: {symptom}, Severity: {severity}, Duration: {duration}, Description: {description}."
    live_profile = f"Age {user.age}, Weight {user.weight} kg, Height {user.height} cm, Diet: {user.diet_preference}."

    raw = query_rag_profile(
        question=question,
        live_profile_text=live_profile,
        index_path=str(ip),
        data_path=str(dp),
        top_k=5,
        instruction_mode="symptom_profile"
    )
    # Symptom answers rarely need numbers → strip by default
    return _strip_profile_numbers(raw)

def run_personalised_rag_with_profile(message, user):
    msg = (message or "").strip().lower()

    # deterministic shortcuts
    if msg in ["what is my age", "tell me my age", "how old am i"]:
        return f"You are {user.age} years old."
    if msg in ["what is my weight", "tell me my weight", "how much do i weigh"]:
        return f"Your weight is {user.weight} kg."
    if msg in ["what is my height", "tell me my height", "how tall am i"]:
        return f"Your height is {user.height} cm."
    if msg in ["what is my diet", "tell me my diet", "what is my diet preference"]:
        return f"Your diet preference is {user.diet_preference}."

    live_profile = f"Age {user.age}, Weight {user.weight} kg, Height {user.height} cm, Diet: {user.diet_preference}."
    raw = query_rag_profile(
        question=(message or "").strip(),
        live_profile_text=live_profile,
        index_path=str(IP),
        data_path=str(DP),
        top_k=5,
        instruction_mode="profile"
    )

    # Only keep numbers if explicitly asked about them
    needs_numbers = any(k in msg for k in ["age", "weight", "height"])
    return raw if needs_numbers else _strip_profile_numbers(raw)