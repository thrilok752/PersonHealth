#!/usr/bin/env python3
"""
Run your Symptom-Only (FAISS + base model) pipeline on a CSV of inputs and save predictions
for manual review (Good / Partial / Poor).

Inputs CSV columns (header required):
  Symptom, Severity, Duration, Description

Usage example:
  python eval_symptom_only_generate.py ^
    --rag_py "D:/projectmtech/backend/api/rag_symptom.py" ^
    --test_csv "D:/projectmtech/backend/api/symptom_only_testset_balanced.csv" ^
    --out_csv  "D:/projectmtech/backend/api/symptom_only_with_predictions.csv"
"""

import argparse
import importlib.util
import sys
import pandas as pd

def _load_module(path: str, name: str = "rag_symptom_only"):
    spec = importlib.util.spec_from_file_location(name, path)
    if not spec or not spec.loader:
        sys.exit(f"[ERROR] Cannot load module: {path}")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

def main():
    ap = argparse.ArgumentParser(description="Generate predictions for Symptom-Only using your RAG pipeline.")
    ap.add_argument("--rag_py", required=True, help="Path to your module that defines run_rag_symptom_only(fields)")
    ap.add_argument("--test_csv", required=True, help="CSV with columns: Symptom,Severity,Duration,Description")
    ap.add_argument("--out_csv", default="symptom_only_with_predictions.csv", help="Where to save results")
    args = ap.parse_args()

    # Load your module and function
    mod = _load_module(args.rag_py)
    if not hasattr(mod, "run_rag_symptom_only"):
        sys.exit("[ERROR] Function run_rag_symptom_only(fields) not found in the given module.")
    run_fn = getattr(mod, "run_rag_symptom_only")

    # Read test set
    df = pd.read_csv(args.test_csv, encoding="utf-8", on_bad_lines="skip")
    required = {"Symptom", "Severity", "Duration", "Description"}
    if not required.issubset(df.columns):
        sys.exit(f"[ERROR] CSV must have columns: {sorted(list(required))}")

    preds = []
    for i, row in df.iterrows():
        fields = {
            "symptom": str(row["Symptom"]).strip(),
            "severity": str(row["Severity"]).strip(),
            "duration": str(row["Duration"]).strip(),
            "description": str(row["Description"]).strip(),
        }
        try:
            pred = run_fn(fields)  # <-- uses your real pipeline exactly
        except Exception as e:
            pred = f"[ERROR calling run_rag_symptom_only: {e}]"
        preds.append(pred)
        print(f"[{i+1:03d}] {fields['symptom']} | {fields['severity']} | {fields['duration']} -> {pred[:120]}")

    out = df.copy()
    out["Prediction"] = preds
    # Columns for manual review (you fill these):
    out["Reviewer_Label"] = ""   # Good / Partial / Poor
    out["Reviewer_Notes"] = ""   # short reason
    out.to_csv(args.out_csv, index=False, encoding="utf-8")

    print(f"\n✅ Saved predictions for manual review: {args.out_csv}")
    print("   Fill Reviewer_Label (Good/Partial/Poor) and Reviewer_Notes, then run the summary script.")

if __name__ == "__main__":
    main()
