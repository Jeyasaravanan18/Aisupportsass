"""
config.py — Application configuration using OpenRouter (OpenAI-compatible API).
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ─── OpenRouter ───────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")

if not OPENROUTER_API_KEY:
    raise EnvironmentError(
        "OPENROUTER_API_KEY is not set. Add it to your .env file."
    )

# ─── Embeddings ───────────────────────────────────────────────────────────────
# Using local sentence-transformers (free, no API key needed)
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"   # fast, 384-dim, runs on CPU
EMBEDDING_FALLBACK_DIM = int(os.getenv("EMBEDDING_FALLBACK_DIM", "384"))

# ─── ChromaDB ─────────────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

# ─── Knowledge Base ───────────────────────────────────────────────────────────
KB_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")

# ─── RAG Settings ─────────────────────────────────────────────────────────────
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
RAG_TOP_K = 3

# ─── Escalation ───────────────────────────────────────────────────────────────
ESCALATION_ALERT_THRESHOLD = 70

# ─── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")


def get_llm_client() -> OpenAI:
    """Return an OpenAI client pointed at OpenRouter."""
    return OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
    )


def call_llm(
    prompt: str,
    system: str = "You are a helpful AI assistant.",
    temperature: float = 0.7,
    max_tokens: int = 512,
) -> str:
    """
    Call OpenRouter with automatic fallback across free models if response is empty.
    """
    client = get_llm_client()

    # Priority list: fastest free models first, heavier ones as fallback
    models_to_try = [
        OPENROUTER_MODEL,
        "google/gemma-3n-e4b-it:free",
        "microsoft/mai-ds-r1:free",
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3.5-lightning:free",
    ]
    # Deduplicate while preserving order
    seen = set()
    fallback_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

    last_error = None
    for model in fallback_models:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=30,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AI Support Coach",
                },
            )
            text = ""
            if response.choices and response.choices[0].message.content:
                text = response.choices[0].message.content.strip()
            if text:
                return text
            print(f"[LLM] Model '{model}' returned empty — trying next fallback…")
        except Exception as e:
            last_error = e
            print(f"[LLM] Model '{model}' errored: {e} — trying next fallback…")

    raise RuntimeError(f"All LLM models failed. Last error: {last_error}")


# ─── Lazy-loaded embedding model ──────────────────────────────────────────────
_embedding_model = None
_embedding_fallback_warned = False


def _hash_embed(text: str, dim: int = EMBEDDING_FALLBACK_DIM) -> list[float]:
    import hashlib
    import math

    vec = [0.0] * dim
    tokens = [t for t in text.lower().split() if t]
    if not tokens:
        return vec

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for i in range(0, len(digest), 4):
            idx = int.from_bytes(digest[i:i+4], "little") % dim
            vec[idx] += 1.0

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]

def get_embedding_model():
    """Return the embedding model if locally available; otherwise use fallback."""
    global _embedding_model
    if _embedding_model is None:
        global _embedding_fallback_warned
        if not _embedding_fallback_warned:
            print("[config] Using local hash embeddings (offline fallback).")
            _embedding_fallback_warned = True
    return _embedding_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts using sentence-transformers. Returns list of float vectors."""
    model = get_embedding_model()
    if model is None:
        return [_hash_embed(text) for text in texts]
    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    return embed_texts([query])[0]
