"""
intent_sentiment.py — Intent & Sentiment Analysis Agent (OpenRouter).
"""

from __future__ import annotations
import json
import re
from typing import List

from config import call_llm
from models import ConversationMessage, IntentSentimentResult, SentimentLabel


def analyze(customer_message: str, history: List[ConversationMessage]) -> IntentSentimentResult:
    history_text = "\n".join(
        f"{'Customer' if m.role == 'customer' else 'Agent'}: {m.content}"
        for m in history[-10:]
    )

    system = "You are an Intent & Sentiment Analysis Agent. Respond with ONLY valid JSON — no markdown, no explanation."

    prompt = f"""Analyze the latest customer message in context.

CONVERSATION HISTORY:
{history_text if history_text else "(No prior conversation)"}

LATEST CUSTOMER MESSAGE:
{customer_message}

Return this exact JSON:
{{
  "intent": "One concise phrase (e.g. 'Password reset help')",
  "emotional_state": "One descriptive phrase (e.g. 'Frustrated and impatient')",
  "frustration_level": <integer 1-5>,
  "satisfaction_trend": "improving | stable | declining",
  "sentiment_label": "very_negative | negative | neutral | positive | very_positive",
  "sentiment_score": <float -1.0 to 1.0>
}}"""

    raw = call_llm(prompt, system=system, temperature=0.3)
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {
            "intent": "General inquiry",
            "emotional_state": "Neutral",
            "frustration_level": 2,
            "satisfaction_trend": "stable",
            "sentiment_label": "neutral",
            "sentiment_score": 0.0,
        }

    frustration = max(1, min(5, int(data.get("frustration_level", 2))))
    sentiment_score = max(-1.0, min(1.0, float(data.get("sentiment_score", 0.0))))
    try:
        sentiment_label = SentimentLabel(data.get("sentiment_label", "neutral"))
    except ValueError:
        sentiment_label = SentimentLabel.NEUTRAL

    return IntentSentimentResult(
        intent=data.get("intent", "General inquiry"),
        emotional_state=data.get("emotional_state", "Neutral"),
        frustration_level=frustration,
        satisfaction_trend=data.get("satisfaction_trend", "stable"),
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score,
    )
