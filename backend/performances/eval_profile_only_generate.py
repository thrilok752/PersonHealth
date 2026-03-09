#!/usr/bin/env python3
"""
Generate predictions for Profile-Only using your real pipeline.

Input CSV must have headers:
ID, Message, Age, Weight, Height, Diet

Usage:
  python eval_profile_only_generate.py ^
    --rag_py "D:/projectmtech/backend/performances/rag_profile.py" ^
    --test_csv "D:/projectmtech/backend/performances/profile_only_testset_balanced.csv" ^
    --out_csv  "D:/projectmtech/backend/performances/profile_only_with_predictions.csv"
"""

import argparse, importlib.util, sys, pandas as pd
from types import SimpleNamespace

DETERMINISTIC = {
    "what is my age", "tell me my age", "how old am i",
    "what is my weight", "tell me my weight", "how much do i weigh",
    "what is my height", "tell me my height", "how tall am i",
    "what is my diet", "tell me my diet", "what is my diet preference",
}

def _load_module(path: str, name: str = "rag_profile_mod"):
    spec = importlib.util.spec_from_file_location(name, path)
    if not spec or not spec.loader:
        sys.exit(f"[ERROR] Cannot load module: {path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rag_py", required=True)
    ap.add_argument("--test_csv", required=True)
    ap.add_argument("--out_csv", default="profile_only_with_predictions.csv")
    args = ap.parse_args()

    mod = _load_module(args.rag_py)
    if not hasattr(mod, "run_personalised_rag_with_profile"):
        sys.exit("[ERROR] run_personalised_rag_with_profile(message, user) not found.")
    run_fn = getattr(mod, "run_personalised_rag_with_profile")

    df = pd.read_csv(args.test_csv, encoding="utf-8", on_bad_lines="skip")
    req = {"ID","Message","Age","Weight","Height","Diet"}
    if not req.issubset(df.columns):
        sys.exit(f"[ERROR] CSV must have columns: {sorted(list(req))}")

    preds = []
    for i, r in df.iterrows():
        msg = str(r["Message"]).strip()
        user = SimpleNamespace(
            age=str(r["Age"]).strip(),
            weight=str(r["Weight"]).strip(),
            height=str(r["Height"]).strip(),
            diet_preference=str(r["Diet"]).strip()
        )
        try:
            pred = run_fn(msg, user)
        except Exception as e:
            pred = f"[ERROR calling run_personalised_rag_with_profile: {e}]"
        preds.append(pred)
        flag = " (deterministic)" if msg.lower() in DETERMINISTIC else ""
        print(f"[{i+1:03d}] {msg[:70]}{flag} -> {pred[:120]}")

    out = df.copy()
    out["Prediction"] = preds
    # placeholders (filled in next step)
    out["Evaluation"] = ""
    out["Personalisation_Type"] = ""
    out["Reviewer_Notes"] = ""
    out.to_csv(args.out_csv, index=False, encoding="utf-8")
    print(f"\n✅ Saved predictions: {args.out_csv}")

if __name__ == "__main__":
    main()
