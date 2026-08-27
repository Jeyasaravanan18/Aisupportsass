"""
retriever.py — Query ChromaDB using local sentence-transformer embeddings.
"""

from __future__ import annotations
from typing import List

import chromadb
from chromadb.config import Settings

from config import CHROMA_PERSIST_DIR, RAG_TOP_K, embed_query
from models import KnowledgeArticle


def _get_chroma_client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )


def retrieve(query: str, collection_name: str = "global_kb", top_k: int = RAG_TOP_K) -> List[KnowledgeArticle]:
    try:
        client = _get_chroma_client()
        collection = client.get_collection(name=collection_name)
    except Exception:
        return []

    count = collection.count()
    if count == 0:
        return []

    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
        include=["documents", "metadatas", "distances"],
    )

    articles: List[KnowledgeArticle] = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for doc, meta, distance in zip(docs, metas, distances):
        relevance = round(max(0.0, 1 - distance), 3)
        source = meta.get("source", "Unknown")
        first_line = doc.strip().split("\n")[0][:80]
        title = first_line if first_line else source
        excerpt = doc.strip()[:400]
        if len(doc.strip()) > 400:
            excerpt += "…"

        articles.append(KnowledgeArticle(
            title=title,
            excerpt=excerpt,
            article_id=f"{source}_chunk_{meta.get('chunk_index', 0)}",
            relevance_score=relevance,
        ))

    return articles
