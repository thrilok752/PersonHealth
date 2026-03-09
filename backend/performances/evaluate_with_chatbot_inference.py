#!/usr/bin/env python3
"""
Evaluate fine-tuned BioGPT using the SAME inference you use in production.
- Imports generate_answer() from chatbot.py
- Runs on an external test set (CSV with columns: Question, Expected Answer)
- Reports EM, token F1, optional BERTScore
"""

import argparse
import importlib.util
import re
import sys
from typing import List

import pandas as pd

# --- Optional BERTScore (graceful fallback) ---
_HAS_BERTSCORE = True
try:
    from evaluate import load as hf_load
    _bertscore = hf_load("bertscore")
except Exception:
    _HAS_BERTSCORE = False
    _bertscore = None


def clean_text(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9 ]", "", text)
    return text


def exact_match(pred: str, gold: str) -> int:
    return int(clean_text(pred) == clean_text(gold))


def f1_overlap(pred: str, gold: str) -> float:
    p = clean_text(pred).split()
    g = clean_text(gold).split()
    if not p or not g:
        return 0.0
    common = set(p) & set(g)
    if not common:
        return 0.0
    return 2 * len(common) / (len(p) + len(g))


def load_chatbot_module(chatbot_path: str):
    """Dynamically load chatbot.py so we can call generate_answer() exactly as in production."""
    spec = importlib.util.spec_from_file_location("chatbot", chatbot_path)
    if spec is None or spec.loader is None:
        sys.exit(f"Could not load module from: {chatbot_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules["chatbot"] = module
    spec.loader.exec_module(module)
    if not hasattr(module, "generate_answer"):
        sys.exit("chatbot.py must expose a function named generate_answer(question: str, max_length: int=...)")
    return module


def main():
    ap = argparse.ArgumentParser(description="Evaluate BioGPT using production inference (chatbot.py).")
    ap.add_argument("--chatbot_py", type=str, required=True, help="Path to your chatbot.py (with generate_answer)")
    ap.add_argument("--test_csv", type=str, required=True, help="CSV with columns: Question, Expected Answer")
    ap.add_argument("--out_csv", type=str, default="evaluation_results.csv", help="Where to save detailed results")
    ap.add_argument("--max_length", type=int, default=200, help="Pass-through to generate_answer()")
    ap.add_argument("--no_bertscore", action="store_true", help="Skip BERTScore even if available")
    args = ap.parse_args()

    # Load chatbot.py and its generate_answer
    chatbot = load_chatbot_module(args.chatbot_py)
    gen_fn = getattr(chatbot, "generate_answer")

    # Load test set
    df = pd.read_csv(args.test_csv)
    if not {"Question", "Expected Answer"}.issubset(df.columns):
        sys.exit("Test CSV must have columns: 'Question' and 'Expected Answer'")

    preds: List[str] = []
    ems: List[int] = []
    f1s: List[float] = []

    for i, row in df.iterrows():
        q = str(row["Question"]).strip()
        gold = str(row["Expected Answer"]).strip()

        # Call your *actual* inference
        pred = gen_fn(q, max_length=args.max_length)
        preds.append(pred)
        ems.append(exact_match(pred, gold))
        f1s.append(f1_overlap(pred, gold))
        print(f"[{i+1:02d}] Q: {q}\n   GOLD: {gold}\n   PRED: {pred}\n   EM={ems[-1]} F1={f1s[-1]:.2f}\n")

    # Optional BERTScore
    bert_f1 = None
    bert_per = None
    if _HAS_BERTSCORE and not args.no_bertscore:
        try:
            bert = _bertscore.compute(predictions=preds, references=df["Expected Answer"].tolist(), lang="en")
            bert_per = bert["f1"]
            bert_f1 = sum(bert_per) / len(bert_per)
        except Exception as e:
            print(f"[warn] BERTScore failed: {e}")

    print("=== SUMMARY ===")
    print(f"Exact Match: {sum(ems)/len(ems):.3f}")
    print(f"Token F1:    {sum(f1s)/len(f1s):.3f}")
    if bert_f1 is not None:
        print(f"BERTScore F1:{bert_f1:.3f}")

    # Save details
    out = df.copy()
    out["Prediction"] = preds
    out["EM"] = ems
    out["F1"] = f1s
    if bert_per is not None:
        out["BERTScore"] = bert_per
    out.to_csv(args.out_csv, index=False)
    print(f"Saved detailed results to: {args.out_csv}")


if __name__ == "__main__":
    main()
