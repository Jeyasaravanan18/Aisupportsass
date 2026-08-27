"""
coaching_agent.py — Coaching & Response Suggestion Agent (OpenRouter).
"""

from __future__ import annotations
import json
import re
from typing import List

from config import call_llm
from models import ConversationMessage, IntentSentimentResult, KnowledgeArticle, CoachingResult


def coach(
    customer_message: str,
    product_context: str,
    intent_sentiment: IntentSentimentResult,
    knowledge_articles: List[KnowledgeArticle],
    history: List[ConversationMessage],
) -> CoachingResult:

    kb_text = "\n\n".join(
        f"[Article {i+1}: {a.title}]\n{a.excerpt}"
        for i, a in enumerate(knowledge_articles)
    ) if knowledge_articles else "No specific articles retrieved. Use general best practices."

    history_text = "\n".join(
        f"{'Customer' if m.role == 'customer' else 'Agent'}: {m.content}"
        for m in history[-10:]
    )

    system = "You are an expert Customer Support Coaching Agent. Respond with ONLY valid JSON — no markdown, no explanation."

    prompt = f"""Coach a support agent on their next response.

CONTEXT:
- Product: {product_context}
- Customer Intent: {intent_sentiment.intent}
- Emotional State: {intent_sentiment.emotional_state}
- Frustration Level: {intent_sentiment.frustration_level}/5
- Satisfaction Trend: {intent_sentiment.satisfaction_trend}

RELEVANT KB ARTICLES:
{kb_text}

CONVERSATION:
{history_text if history_text else "(No prior conversation)"}

LATEST CUSTOMER MESSAGE:
{customer_message}

Return this exact JSON:
{{
  "suggested_response": "Complete empathetic professional response incorporating KB knowledge naturally",
  "tone_score": <integer 1-10>,
  "tone_feedback": "Brief tone assessment for this customer's emotional state",
  "improvement_tips": ["Tip 1", "Tip 2", "Tip 3"]
}}

Guidelines: Open with empathy if frustration >= 3. Be specific and actionable. End with clear next step."""

    raw = call_llm(prompt, system=system, temperature=0.5)
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {
            "suggested_response": "Thank you for reaching out. I understand your concern and I'm here to help. Could you provide more details so I can assist you better?",
            "tone_score": 7,
            "tone_feedback": "Maintain a calm, empathetic tone.",
            "improvement_tips": [
                "Acknowledge the customer's frustration explicitly.",
                "Provide a concrete timeline for resolution.",
                "Offer a direct next step.",
            ],
        }

    tone_score = max(1, min(10, int(data.get("tone_score", 7))))
    tips = data.get("improvement_tips", [])
    if not isinstance(tips, list):
        tips = [str(tips)]

    return CoachingResult(
        suggested_response=data.get("suggested_response", ""),
        tone_score=tone_score,
        tone_feedback=data.get("tone_feedback", ""),
        improvement_tips=tips[:5],
    )
