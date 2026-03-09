from transformers import AutoModelForCausalLM, AutoTokenizer
from torch import cuda
import torch, transformers, os
device = "cuda" if cuda.is_available() else "cpu"
LOAD_PATH = "D:/projectmtech/backend/api/biogpt_qa_refinetuned_final"

tokenizer = AutoTokenizer.from_pretrained(LOAD_PATH)
model = AutoModelForCausalLM.from_pretrained(LOAD_PATH).to(device)

print("Torch:", torch.__version__, "| Transformers:", transformers.__version__)
print("CUDA available:", torch.cuda.is_available(), "| Device:", "cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
    
print("Fine-tuned model loaded! ✅")
import torch
def get_answer(question, max_length=200):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    input_text = f"Question: {question}\nAnswer:"
    inputs = tokenizer(input_text, return_tensors="pt").to(device)
    print("Prompt repr:", repr(input_text))
    print("Input token count:", len(tokenizer(input_text, return_tensors="pt")["input_ids"][0]))

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_length=max_length,
            do_sample=False,
            temperature=1.0,
            num_beams=4,
            no_repeat_ngram_size=2,
            early_stopping=True
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=True)

    # Extract answer after "Answer:"
    if "Answer:" in decoded:
        answer = decoded.split("Answer:")[-1].strip()
    else:
        answer = decoded.strip()

    # Optional: Trim to first 1–2 sentences
    sentences = answer.split(". ")
    if len(sentences) > 1:
        answer = ". ".join(sentences[:2]) + "."

    return answer
qa=["what are the symptoms of fever?",

"What are the symptoms of malaria?",

"Can I take paracetamol during pregnancy?",

"How to reduce high blood pressure naturally?"]


for i in qa:
  print(i)
  print(get_answer(i))


# import os, hashlib, json
# from transformers import AutoTokenizer, AutoModelForCausalLM

# # LOAD_PATH = r"/content/drive/MyDrive/biogpt_qa_refinetuned_final"   # COLAB
# LOAD_PATH = r"D:/projectmtech/backend/api/biogpt_qa_refinetuned_final"  # LOCAL

# def md5_file(path):
#     h = hashlib.md5()
#     with open(path, "rb") as f:
#         for chunk in iter(lambda: f.read(8192), b""):
#             h.update(chunk)
#     return h.hexdigest()

# def md5_dir(path):
#     h = hashlib.md5()
#     for root, _, files in os.walk(path):
#         for f in sorted(files):
#             p = os.path.join(root, f)
#             with open(p, "rb") as fh:
#                 for chunk in iter(lambda: fh.read(8192), b""):
#                     h.update(chunk)
#     return h.hexdigest()

# print("DIR_MD5:", md5_dir(LOAD_PATH))

# # Print individual key files too
# for name in ["pytorch_model.bin", "model.safetensors", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.json", "merges.txt", "config.json"]:
#     p = os.path.join(LOAD_PATH, name)
#     if os.path.exists(p):
#         print(name, md5_file(p))
