# api/chatbot2.py
import os
os.environ["TORCH_COMPILE_DISABLE"] = "1"
os.environ["TORCHDYNAMO_DISABLE"] = "1"   # <-- add this
import re
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig

# --- Keep PyTorch from trying to compile/optimize on your GTX 1050 setup ---
os.environ["TORCH_COMPILE_DISABLE"] = "1"
try:
    import torch._dynamo
    torch._dynamo.disable()
    torch._dynamo.config.suppress_errors = True
except Exception:
    pass

MODEL_NAME = "google/gemma-3-1b-it"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

tokenizer1 = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
if tokenizer1.pad_token_id is None and tokenizer1.eos_token_id is not None:
    tokenizer1.pad_token = tokenizer1.eos_token

model1 = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype="auto")
model1.to(DEVICE)
model1.eval()
print(f"✅ Gemma loaded on {DEVICE}")

gen_cfg = GenerationConfig(
    max_new_tokens=110,
    do_sample=True,          # natural variety
    temperature=0.85,
    top_p=0.9,
    num_beams=1,             # no beam search when sampling
    no_repeat_ngram_size=2,
    eos_token_id=tokenizer1.eos_token_id,
    pad_token_id=tokenizer1.pad_token_id,
    use_cache=True,
)
model1.generation_config = gen_cfg  # avoid confusing warnings

def _sanitize_two_sentences(text: str) -> str:
    """Strip URLs/junk and keep only first 2 sentences."""
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'[^\x09\x0A\x0D\x20-\x7E]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    parts = re.split(r'(?<=[.!?])\s+', text)
    parts = [p.strip() for p in parts if p.strip()]
    text = " ".join(parts[:2])
    if text and text[-1] not in ".!?":
        text += "."
    # scrub any weird leftover phrases
    for bad in ("Technically, I cannot fulfill this request", "Whoever you are"):
        text = text.replace(bad, "").strip()
    if not text and parts:
        text = parts[0]
        if text and text[-1] not in ".!?":
            text += "."
    return text

def generate_answer_base(prompt: str) -> str:
    """Call Gemma-IT with a simple chat template and return 2 clean sentences."""
    messages = [
        {"role": "system", "content": "You are a helpful healthcare assistant."},
        {"role": "user", "content": prompt},
    ]
    model_input = tokenizer1.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to(DEVICE)

    with torch.no_grad():
        output_ids = model1.generate(model_input, generation_config=gen_cfg)

    generated_ids = output_ids[0][model_input.shape[-1]:]
    text = tokenizer1.decode(generated_ids, skip_special_tokens=True).strip()
    return _sanitize_two_sentences(text)
