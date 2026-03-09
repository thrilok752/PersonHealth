# chatbot.py
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
torch.cuda.empty_cache()
print("🔄 Loading models...")

# Fine-tuned model
finetuned_path = "D:/projectmtech/backend/api/biogpt_qa_refinetuned_final"
tokenizer = AutoTokenizer.from_pretrained(finetuned_path, local_files_only=True)
model = AutoModelForCausalLM.from_pretrained(finetuned_path, local_files_only=True,torch_dtype=torch.float16).to("cuda")
model.eval()

print(f"fine tuned biogpt loaded! ")

import torch
def generate_answer(question, max_length=200):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    # Capitalize the first letter of the question (if not already)
    question = question.strip()
    if question and not question[0].isupper():
        question = question[0].upper() + question[1:]

    input_text = f"Question: {question}\nAnswer:"
    inputs = tokenizer(input_text, return_tensors="pt").to(device)

    with torch.no_grad():
        output = model.generate(
    **inputs,
    max_length=max_length,
    do_sample=True,           # Enables randomness
    top_k=50,                 # Consider top 50 tokens only
    top_p=0.9,                # Or use nucleus sampling
    temperature=0.8,          # Slightly less random than 1.0
    num_beams=1,              # Set to 1 when sampling
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