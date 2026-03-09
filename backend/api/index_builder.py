# utils/index_builder.py
# --- Force CPU so Windows won't try to load CUDA DLLs during build ---
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""      # hide GPUs
os.environ["TORCH_COMPILE_DISABLE"] = "1"    # avoid torch.compile

import torch
torch.set_num_threads(4)                     # play nice with CPU

import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
import pickle


# Single SBERT model used for all indices (CPU)
_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")


def _encode_texts(texts):
    """Encode texts on CPU with reasonable batch size; returns np.float32 array."""
    return _model.encode(
        texts,
        batch_size=16,                # lower if RAM is tight
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=False,   # keep raw; FAISS IndexFlatL2 expects L2 space
    ).astype("float32")


def build_index_qna(excel_path, question_cols, answer_col, save_prefix):
    """
    Build a FAISS index from concatenated question columns.
    Saves:
      - {save_prefix}_index.faiss : FAISS L2 index over question embeddings
      - {save_prefix}_data.pkl    : list[dict] with {'q': <question_text>, 'a': <answer_text>}
    """
    df = pd.read_excel(excel_path)

    # Compose retrievable "question" text from selected columns
    q_texts = df[question_cols].fillna("").astype(str).agg(" ".join, axis=1).tolist()
    a_texts = df[answer_col].fillna("").astype(str).tolist()

    # Store Q&A objects for richer RAG context
    qna_rows = [{"q": q.strip(), "a": a.strip()} for q, a in zip(q_texts, a_texts)]

    # Encode only questions for retrieval
    embs = _encode_texts(q_texts)
    dim = embs.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embs)

    faiss.write_index(index, f"{save_prefix}_index.faiss")
    with open(f"{save_prefix}_data.pkl", "wb") as f:
        pickle.dump(qna_rows, f)

    print(f"✅ Built: {save_prefix}_index.faiss + {save_prefix}_data.pkl")
    print(f"   Items: {len(qna_rows)} | Dim: {dim}")


if __name__ == "__main__":
    # symptoms.xlsx
    build_index_qna(
        "D:/projectmtech/backend/datasets/symptoms.xlsx",
        question_cols=["Symptom", "Severity", "Duration", "Description"],
        answer_col="Response",
        save_prefix="symptom"
    )

    # profile.xlsx
    build_index_qna(
        "D:/projectmtech/backend/datasets/profile.xlsx",
        question_cols=["Age", "Weight (kg)", "Height (cm)", "Diet", "Question"],
        answer_col="Answer",
        save_prefix="profile"
    )

    # symptom_profile.xlsx
    build_index_qna(
        "D:/projectmtech/backend/datasets/symptom_profile.xlsx",
        question_cols=["Symptom", "Severity", "Duration", "Description", "Age", "Weight", "Height", "Diet"],
        answer_col="Response",
        save_prefix="symptom_profile"
    )
