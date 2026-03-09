# api/rag_helper.py
import re
import faiss
import pickle
from sentence_transformers import SentenceTransformer
from .chatbot2 import generate_answer_base  # Gemma call

# One shared encoder
_model = SentenceTransformer("all-MiniLM-L6-v2")

# ---------------------------
# Helper: strip profile-like numeric mentions from model output
# (so old dataset ages/weights/heights don't leak)
# ---------------------------
_NUMBERY_PATTERNS = [
    r"\b\d{1,3}\s*-\s*year\s*-\s*old\b",
    r"\b\d{1,3}\s*(?:years?|yrs?)\b",
    r"\b\d{2,3}\s?kg\b",
    r"\b\d{2,3}\s?cm\b",
    r"\b\d(?:\.\d{1,2})?\s?m\b",
]

def _strip_profile_numbers(text: str) -> str:
    out = text
    for pat in _NUMBERY_PATTERNS:
        out = re.sub(pat, "", out, flags=re.IGNORECASE)
    out = re.sub(r"\s{2,}", " ", out).strip()
    return out

# ---------------------------
# UNCHANGED: basic query for symptom_only
# ---------------------------
def query_rag(input_text=None, index_path=None, data_path=None, top_k=3, input_fields=None):
    """Basic retrieval (used ONLY by symptom_only). No profile logic here."""
    if input_fields:
        input_text = " ".join([f"{k}: {v}" for k, v in input_fields.items() if v])
    if not input_text:
        raise ValueError("Either input_text or input_fields must be provided.")

    index = faiss.read_index(index_path)
    with open(data_path, "rb") as f:
        data = pickle.load(f)

    qvec = _model.encode([input_text])
    _, I = index.search(qvec, top_k)

    # supports both old (string) and new (dict with q/a) stores
    snippets = []
    for i in I[0]:
        row = data[i]
        if isinstance(row, dict) and "q" in row and "a" in row:
            snippets.append(f"Q: {row['q']}\nA: {row['a']}")
        else:
            snippets.append(str(row))
    context = "\n\n".join(snippets)

    rules = (
        "Based on the symptom details and the retrieved context above, provide a clear, "
        "practical health suggestion and relevant precautions. "
        "If the context is insufficient or inaccurate, use your own general health knowledge "
        "to fill in the gaps. "
        "Respond in exactly 2 complete, natural-sounding sentences."
    )

    prompt = (
        f"Context:\n{context.strip()}\n\n"
        f"Symptom details: {input_text.strip()}\n\n"
        f"Instructions: {rules}"
    )

    return generate_answer_base(prompt)


# ---------------------------
# Profile-safe query for profile & symptom_profile
# ---------------------------
def query_rag_profile(*, question: str, live_profile_text: str, index_path: str, data_path: str, top_k: int = 5,instruction_mode: str):
    if not question:
        raise ValueError("question is required")

    index = faiss.read_index(index_path)
    with open(data_path, "rb") as f:
        data = pickle.load(f)

    qvec = _model.encode([question])
    _, I = index.search(qvec, top_k)

    snippets = []
    for i in I[0]:
        row = data[i]
        if isinstance(row, dict) and "q" in row and "a" in row:
            snippets.append(f"Q: {row['q']}\nA: {row['a']}")
        else:
            snippets.append(str(row))
    context = "\n\n".join(snippets)

    if instruction_mode == "profile":
        rules = (
           "Use the LIVE PROFILE only to tailor the answer. "
           "give only suggestion do not mention profile details at all but consider live profile for response internally "
           "Ignore numbers in retrieved examples. "
           "If the retrieved examples are insufficient or inaccurate, use your own general health knowledge "
           "to fill in the gaps. "
           "Answer naturally in exactly 1 or 2 complete sentences."

        )
    elif instruction_mode == "symptom_profile":
        rules = (
            "Use the LIVE PROFILE internally to tailor the suggestion."
            "Based on the question(symptom details) and the retrieved examples above, provide a clear, "
            "practical health suggestion and relevant precautions. "
            "donot mention duration in the response at all"
            "If the retrieved examples are insufficient or inaccurate, use your own general health knowledge "
            "to fill in the gaps. "
            "Respond in exactly 1 or 2 complete, natural-sounding sentences."
    )
        


    prompt = (
        "LIVE PROFILE:\n"
        f"{(live_profile_text or 'None')}\n\n"
        "QUESTION:\n"
        f"{question.strip()}\n\n"
        "RETRIEVED EXAMPLES (style only):\n"
        f"{(context.strip() or '—')}\n\n"
        f"{rules}"
    )
    print(prompt)
    return generate_answer_base(prompt)
