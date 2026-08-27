"""
knowledge_agent.py — Knowledge Recommendation Agent.
Wraps the RAG retriever to surface contextually relevant KB articles.
"""

from __future__ import annotations
from typing import List

from models import ConversationMessage, IntentSentimentResult, KnowledgeArticle
from rag.retriever import retrieve


def recommend(
    customer_message: str,
    intent_sentiment: IntentSentimentResult,
    history: List[ConversationMessage],
    collection_name: str = "global_kb",
) -> List[KnowledgeArticle]:
    """
    Build a rich query from the customer message + intent, then retrieve
    the top-k most relevant knowledge base articles.

    Args:
        customer_message: The latest customer message.
        intent_sentiment: Result from Intent & Sentiment Agent.
        history: Conversation history (used to enrich query context).
        collection_name: ChromaDB collection to query.

    Returns:
        List of KnowledgeArticle objects sorted by relevance.
    """
    # Build an enriched query combining message text and detected intent
    query_parts = [
        customer_message,
        f"Intent: {intent_sentiment.intent}",
        f"Customer issue: {intent_sentiment.emotional_state}",
    ]

    # Include the last agent reply for context if it exists
    agent_replies = [m for m in history if m.role == "agent"]
    if agent_replies:
        last_agent = agent_replies[-1].content[:200]
        query_parts.append(f"Agent last said: {last_agent}")

    query = " | ".join(query_parts)

    articles = retrieve(query=query, collection_name=collection_name)
    return articles
