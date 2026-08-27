"""
summary_agent.py — Post-Interaction Summary Agent.
Deterministic analytics derived from the actual session turn data.
"""

from __future__ import annotations

from statistics import mean
from typing import List

from models import (
    ConversationMessage,
    SentimentJourneyPoint,
    EscalationMoment,
    PerformanceReport,
    InteractionMode,
    SentimentLabel,
)


def _sentiment_to_score(label: SentimentLabel) -> int:
    return {
        SentimentLabel.VERY_NEGATIVE: 1,
        SentimentLabel.NEGATIVE: 2,
        SentimentLabel.NEUTRAL: 3,
        SentimentLabel.POSITIVE: 4,
        SentimentLabel.VERY_POSITIVE: 5,
    }[label]


def _final_sentiment_from_score(score: float) -> SentimentLabel:
    if score <= 1.5:
        return SentimentLabel.VERY_NEGATIVE
    if score <= 2.5:
        return SentimentLabel.NEGATIVE
    if score <= 3.5:
        return SentimentLabel.NEUTRAL
    if score <= 4.5:
        return SentimentLabel.POSITIVE
    return SentimentLabel.VERY_POSITIVE


def generate_report(
    session_id: str,
    agent_name: str,
    product_context: str,
    customer_scenario: str,
    mode: InteractionMode,
    history: List[ConversationMessage],
    sentiment_journey: List[SentimentJourneyPoint],
    escalation_moments: List[EscalationMoment],
    duration_seconds: int | None,
) -> PerformanceReport:
    total_turns = sum(1 for m in history if m.role == "customer")
    average_sentiment_score = round(mean([p.sentiment_score for p in sentiment_journey]), 2) if sentiment_journey else 0.0
    peak_escalation_risk = max((e.risk_score for e in escalation_moments), default=0)
    turns_with_escalation_risk = len(escalation_moments)

    sentiment_labels = [p.sentiment_label for p in sentiment_journey]
    first_score = _sentiment_to_score(sentiment_labels[0]) if sentiment_labels else 3
    last_score = _sentiment_to_score(sentiment_labels[-1]) if sentiment_labels else 3
    sentiment_delta = last_score - first_score

    improvement = 0
    if average_sentiment_score > 0:
        improvement += 8
    elif average_sentiment_score < 0:
        improvement -= 8

    if sentiment_delta > 0:
        improvement += 10
    elif sentiment_delta < 0:
        improvement -= 10

    if peak_escalation_risk >= 80:
        improvement -= 18
    elif peak_escalation_risk >= 60:
        improvement -= 10
    elif peak_escalation_risk > 0:
        improvement -= 4

    if total_turns <= 2 and peak_escalation_risk < 40:
        improvement += 8
    elif total_turns > 6 and peak_escalation_risk >= 50:
        improvement -= 6

    resolution_quality_score = max(0, min(100, 70 + improvement))

    empathy_and_tone = max(0, min(25, 14 + int(round(average_sentiment_score * 3))))
    issue_resolution = max(0, min(25, 15 + (10 if total_turns and peak_escalation_risk < 50 else -2 if peak_escalation_risk >= 70 else 4)))
    response_clarity = max(0, min(25, 15 + (3 if total_turns <= 4 else 0) + (2 if sentiment_delta >= 0 else -2)))
    efficiency = max(0, min(25, 15 + (5 if total_turns <= 4 else 0) - (3 if peak_escalation_risk >= 70 else 0)))

    if total_turns == 0:
        summary = "No customer turns were processed, so the session could not be evaluated."
    else:
        last_sentiment = sentiment_labels[-1].value if sentiment_labels else "neutral"
        summary = (
            f"The customer presented {customer_scenario.lower().rstrip('.')}. "
            f"The session ran for {total_turns} customer turns in {mode.value} mode, with an average sentiment of {average_sentiment_score:+.2f}. "
            f"Final sentiment trended {last_sentiment}, and the peak escalation risk reached {peak_escalation_risk}/100. "
            f"The agent's performance was {'strong' if resolution_quality_score >= 75 else 'adequate' if resolution_quality_score >= 60 else 'inconsistent'}, "
            f"with the best opportunity being faster de-escalation and more direct resolution cues."
        )

    coaching_recommendations = [
        "Lead with a direct acknowledgment of the customer's emotion before moving to troubleshooting.",
        "Use shorter, more action-oriented updates when the customer sentiment is declining.",
        "Offer the next concrete step earlier so the customer does not have to ask for it.",
    ]
    if peak_escalation_risk >= 70:
        coaching_recommendations.insert(
            0,
            "Escalate sooner when frustration remains high across multiple turns.",
        )

    knowledge_gaps = [
        "Confirm whether the knowledge base contains a faster resolution path for the root issue.",
    ]
    if total_turns > 4:
        knowledge_gaps.append("Review why the issue required multiple exchanges before reaching a stable resolution.")
    if peak_escalation_risk >= 60:
        knowledge_gaps.append("Add a de-escalation playbook for high-frustration customers.")

    final_customer_sentiment = _final_sentiment_from_score(last_score if sentiment_labels else 3)

    return PerformanceReport(
        session_id=session_id,
        agent_name=agent_name,
        mode=mode,
        total_turns=total_turns,
        duration_seconds=duration_seconds,
        summary=summary,
        average_sentiment_score=average_sentiment_score,
        peak_escalation_risk=peak_escalation_risk,
        turns_with_escalation_risk=turns_with_escalation_risk,
        sentiment_journey=sentiment_journey,
        resolution_quality_score=resolution_quality_score,
        resolution_quality_breakdown={
            "empathy_and_tone": empathy_and_tone,
            "issue_resolution": issue_resolution,
            "response_clarity": response_clarity,
            "efficiency": efficiency,
        },
        escalation_moments=escalation_moments,
        coaching_recommendations=coaching_recommendations[:5],
        top_knowledge_gaps=knowledge_gaps[:3],
        final_customer_sentiment=final_customer_sentiment,
    )
