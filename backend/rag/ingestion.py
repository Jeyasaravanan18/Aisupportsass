"""
ingestion.py — Ingests text/PDF documents into ChromaDB via local sentence-transformer embeddings.
"""

from __future__ import annotations
import os
from typing import List

import chromadb
from chromadb.config import Settings

from config import (
    CHROMA_PERSIST_DIR,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    KB_DIR,
    embed_texts,
)


def _get_chroma_client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )


def _chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        start += size - overlap
    return [c for c in chunks if c.strip()]


def _extract_text_from_file(filepath: str) -> str:
    if filepath.endswith(".pdf"):
        try:
            import fitz
            doc = fitz.open(filepath)
            return "\n".join(page.get_text() for page in doc)
        except Exception as e:
            raise ValueError(f"Failed to read PDF {filepath}: {e}")
    else:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            return f.read()


def ingest_file(filepath: str, collection_name: str = "global_kb") -> int:
    text = _extract_text_from_file(filepath)
    filename = os.path.basename(filepath)
    chunks = _chunk_text(text)
    if not chunks:
        return 0

    embeddings = embed_texts(chunks)

    client = _get_chroma_client()
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"{filename}__chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def ingest_text(text: str, source_name: str, collection_name: str = "global_kb") -> int:
    chunks = _chunk_text(text)
    if not chunks:
        return 0

    embeddings = embed_texts(chunks)

    client = _get_chroma_client()
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"{source_name}__chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": source_name, "chunk_index": i} for i in range(len(chunks))]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def ingest_default_knowledge_base() -> int:
    if not os.path.isdir(KB_DIR):
        return 0

    total = 0
    for fname in os.listdir(KB_DIR):
        fpath = os.path.join(KB_DIR, fname)
        if os.path.isfile(fpath) and fname.endswith((".txt", ".pdf")):
            try:
                count = ingest_file(fpath, collection_name="global_kb")
                total += count
                print(f"[RAG] Ingested {fname}: {count} chunks")
            except Exception as e:
                print(f"[RAG] Warning: failed to ingest {fname}: {e}")
    return total
