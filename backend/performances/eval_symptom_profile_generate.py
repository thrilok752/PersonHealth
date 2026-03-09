#!/usr/bin/env python3
"""
Generate Symptom+Profile predictions using your real pipeline.

Input CSV must have headers:
Symptom,Severity,Duration,Description,Age,Weight,Height,Diet

Usage:
  python eval_symptom_profile_generate.py ^
    --rag_py "D:/projectmtech/backend/performances/rag_symptom.py" ^
    --test_csv "D:/projectmtech/backend/performances/symptom_profile_testset.csv" ^
    --out_csv  "D:/projectmtech/backend/performances/symptom_profile_with_predictions.csv"
"""

import argparse, importlib.util, sys, pandas as pd
from types import SimpleNamespace

def _load_module(path: str, name: str = "rag_symptom_profile_mod"):
    spec = importlib.util.spec_from_file_location(name, path)
    if not spec or not spec.loader:
        sys.exit(f"[ERROR] Cannot load module: {path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

def main():
    ap = argparse.ArgumentParser(description="Run Symptom+Profile pipeline and save predictions.")
    ap.add_argument("--rag_py", required=True, help="Path to module that defines run_rag_symptom_profile(fields, user)")
    ap.add_argument("--test_csv", required=True, help="CSV with Symptom,Severity,Duration,Description,Age,Weight,Height,Diet")
    ap.add_argument("--out_csv", default="symptom_profile_with_predictions.csv")
    args = ap.parse_args()

    mod = _load_module(args.rag_py)
    if not hasattr(mod, "run_rag_symptom_profile"):
        sys.exit("[ERROR] Function run_rag_symptom_profile(fields, user) not found.")
    run_fn = getattr(mod, "run_rag_symptom_profile")

    df = pd.read_csv(args.test_csv, encoding="utf-8", on_bad_lines="skip")
    required = {"Symptom","Severity","Duration","Description","Age","Weight","Height","Diet"}
    if not required.issubset(df.columns):
        sys.exit(f"[ERROR] CSV must have columns: {sorted(list(required))}")

    preds = []
    for i, r in df.iterrows():
        fields = {
            "symptom": str(r["Symptom"]).strip(),
            "severity": str(r["Severity"]).strip(),
            "duration": str(r["Duration"]).strip(),
            "description": str(r["Description"]).strip(),
        }
        user = SimpleNamespace(
            age=str(r["Age"]).strip(),
            weight=str(r["Weight"]).strip(),
            height=str(r["Height"]).strip(),
            diet_preference=str(r["Diet"]).strip()
        )
        try:
            pred = run_fn(fields, user)
        except Exception as e:
            pred = f"[ERROR calling run_rag_symptom_profile: {e}]"
        preds.append(pred)
        print(f"[{i+1:03d}] {fields['symptom']} | {fields['severity']} | {fields['duration']} -> {pred[:120]}")

    out = df.copy()
    out["Prediction"] = preds

    # Columns for downstream review (filled later)
    out["Reviewer_Label"] = ""    # Good / Partial / Poor
    out["Reviewer_Notes"] = ""    # short reason
    out.to_csv(args.out_csv, index=False, encoding="utf-8")
    print(f"\n✅ Saved predictions: {args.out_csv}")

if __name__ == "__main__":
    main()
