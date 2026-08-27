"""
models.py — Pydantic request/response models for the API.
"""

from __future__ import annotations
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class InteractionMode(str, Enum):
    SIMULATOR = "simulator"
    MANUAL = "manual"
    REPLAY = "replay"


class SentimentLabel(str, Enum):
    VERY_NEGATIVE = "very_negative"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    POSITIVE = "positive"
    VERY_POSITIVE = "very_positive"


# ─── Session ──────────────────────────────────────────────────────────────────

class SessionCreateRequest(BaseModel):
    mode: InteractionMode
    agent_name: str = Field(default="Agent", description="Support agent's name")
    product_context: str = Field(..., description="Product/service context for the session")
    customer_scenario: str = Field(..., description="Description of customer's problem")
    persona_frustration: int = Field(default=3, ge=1, le=5, description="Customer frustration 1-5")
    persona_verbosity: str = Field(default="moderate", description="brief | moderate | detailed")
    replay_transcript: Optional[str] = Field(
        default=None,
        description="Full transcript text for Replay mode (alternating Customer:/Agent: lines)"
    )


class SessionCreateResponse(BaseModel):
    session_id: str
    mode: InteractionMode
    message: str


# ─── Turn ─────────────────────────────────────────────────────────────────────

class TurnRequest(BaseModel):
    session_id: str
    agent_message: Optional[str] = Field(
        default=None,
        description="Agent's reply to send (Manual/Replay modes). Omit for first Simulator turn."
    )


class ConversationMessage(BaseModel):
    role: str          # "customer" | "agent"
    content: str
    turn_index: int


class KnowledgeArticle(BaseModel):
    title: str
    excerpt: str
    article_id: str
    relevance_score: float


class IntentSentimentResult(BaseModel):
    intent: str
    emotional_state: str
    frustration_level: int   # 1–5
    satisfaction_trend: str  # improving | stable | declining
    sentiment_label: SentimentLabel
    sentiment_score: float   # -1.0 to 1.0


class CoachingResult(BaseModel):
    suggested_response: str
    tone_score: int          # 1–10
    tone_feedback: str
    improvement_tips: List[str]


class EscalationResult(BaseModel):
    risk_score: int          # 0–100
    reasoning: str
    strategy: str
    should_alert: bool


class TurnResult(BaseModel):
    session_id: str
    turn_index: int
    customer_message: str
    intent_sentiment: IntentSentimentResult
    knowledge_articles: List[KnowledgeArticle]
    coaching: CoachingResult
    escalation: EscalationResult
    conversation_history: List[ConversationMessage]


# ─── Knowledge Base ───────────────────────────────────────────────────────────

class KBUploadResponse(BaseModel):
    message: str
    chunks_indexed: int
    filename: str


class KBUploadRecord(BaseModel):
    filename: str
    chunks_indexed: int
    uploaded_at: float
    status: str
    source: str = "global_kb"


# ─── Report ───────────────────────────────────────────────────────────────────

class SentimentJourneyPoint(BaseModel):
    turn_index: int
    sentiment_score: float
    sentiment_label: SentimentLabel
    customer_message_preview: str


class EscalationMoment(BaseModel):
    turn_index: int
    risk_score: int
    customer_message_preview: str


class PerformanceReport(BaseModel):
    session_id: str
    agent_name: str
    mode: InteractionMode
    total_turns: int
    duration_seconds: Optional[int]
    summary: str
    average_sentiment_score: float
    peak_escalation_risk: int
    turns_with_escalation_risk: int
    sentiment_journey: List[SentimentJourneyPoint]
    resolution_quality_score: int        # 0–100
    resolution_quality_breakdown: dict[str, Any]
    escalation_moments: List[EscalationMoment]
    coaching_recommendations: List[str]
    top_knowledge_gaps: List[str]
    final_customer_sentiment: SentimentLabel
