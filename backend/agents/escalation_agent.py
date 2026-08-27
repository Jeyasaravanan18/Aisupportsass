"""
escalation_agent.py — Escalation Risk Monitor Agent (OpenRouter).
"""

from __future__ import annotations
import json
import re
from typing import List

from config import call_llm, ESCALATION_ALERT_THRESHOLD
from models import ConversationMessage, IntentSentimentResult, EscalationResult


def assess(
    customer_message: str,
    intent_sentiment: IntentSentimentResult,
    history: List[ConversationMessage],
) -> EscalationResult:

    history_text = "\n".join(
        f"{'Customer' if m.role == 'customer' else 'Agent'}: {m.content}"
        for m in history
    )
    turn_count = sum(1 for m in history if m.role == "customer")

    system = "You are an Escalation Risk Monitor. Respond with ONLY valid JSON — no markdown, no explanation."

    prompt = f"""Assess escalation risk for this support interaction.

CONTEXT:
- Customer Intent: {intent_sentiment.intent}
- Emotional State: {intent_sentiment.emotional_state}
- Frustration Level: {intent_sentiment.frustration_level}/5
- Satisfaction Trend: {intent_sentiment.satisfaction_trend}
- Turn count: {turn_count}

CONVERSATION:
{history_text if history_text else "(No prior conversation)"}

LATEST MESSAGE:
{customer_message}

RISK FACTORS: repeated unresolved issue, explicit threats to cancel/escalate, profanity, high frustration, declining trend, unresolved after 6+ turns.

Return this exact JSON:
{{
  "risk_score": <integer 0-100>,
  "reasoning": "2-3 sentences explaining the risk score based on specific signals",
  "strategy": "Specific de-escalation strategy for the agent right now (2-3 actionable sentences)"
}}"""

    raw = call_llm(prompt, system=system, temperature=0.3)
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        base_risk = intent_sentiment.frustration_level * 15
        data = {
            "risk_score": min(base_risk, 90),
            "reasoning": "Risk estimated from frustration level.",
            "strategy": "Acknowledge frustration, provide concrete solution, confirm resolution.",
        }

    risk_score = max(0, min(100, int(data.get("risk_score", 20))))

    return EscalationResult(
        risk_score=risk_score,
        reasoning=data.get("reasoning", ""),
        strategy=data.get("strategy", ""),
        should_alert=risk_score >= ESCALATION_ALERT_THRESHOLD,
    )
