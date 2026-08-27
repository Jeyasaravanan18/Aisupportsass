"""
session_store.py — In-memory session management.
"""

from __future__ import annotations
import uuid
import time
import re
from typing import Any, Dict, List, Optional

from models import (
    InteractionMode,
    ConversationMessage,
    IntentSentimentResult,
    EscalationResult,
    SentimentJourneyPoint,
    EscalationMoment,
    KBUploadRecord,
)


class Session:
    """Holds all state for a single support interaction session."""

    def __init__(
        self,
        mode: InteractionMode,
        agent_name: str,
        product_context: str,
        customer_scenario: str,
        persona_frustration: int,
        persona_verbosity: str,
        replay_transcript: Optional[str] = None,
    ):
        self.session_id: str = str(uuid.uuid4())
        self.mode = mode
        self.agent_name = agent_name
        self.product_context = product_context
        self.customer_scenario = customer_scenario
        self.persona_frustration = persona_frustration
        self.persona_verbosity = persona_verbosity
        self.created_at = time.time()
        self.ended_at: Optional[float] = None

        # Conversation history
        self.history: List[ConversationMessage] = []

        # Per-turn analytics (for report)
        self.turn_sentiments: List[SentimentJourneyPoint] = []
        self.escalation_moments: List[EscalationMoment] = []
        self.kb_uploads: List[KBUploadRecord] = []

        # Replay mode state
        self.replay_messages: List[str] = []   # list of customer messages from transcript
        self.replay_parse_issues: List[str] = []
        self.replay_index: int = 0
        self.replay_total_lines: int = 0
        self.replay_customer_lines: int = 0
        self.replay_agent_lines: int = 0

        if mode == InteractionMode.REPLAY and replay_transcript:
            self._parse_replay_transcript(replay_transcript)

    def _parse_replay_transcript(self, transcript: str) -> None:
        """Parse alternating Customer:/Agent: lines from a transcript."""
        lines = [line.strip() for line in transcript.strip().splitlines() if line.strip()]
        self.replay_total_lines = len(lines)
        pattern = re.compile(r"^(customer|agent)\s*:\s*(.+)$", re.IGNORECASE)
        for index, line in enumerate(lines, start=1):
            match = pattern.match(line)
            if not match:
                self.replay_parse_issues.append(f"Line {index} ignored: expected 'Customer:' or 'Agent:' prefix.")
                continue

            role = match.group(1).lower()
            content = match.group(2).strip()
            if not content:
                self.replay_parse_issues.append(f"Line {index} ignored: empty {role} message.")
                continue

            if role == "customer":
                self.replay_messages.append(content)
                self.replay_customer_lines += 1
            else:
                self.replay_agent_lines += 1

    @property
    def turn_index(self) -> int:
        """Current turn index = number of customer messages so far."""
        return sum(1 for m in self.history if m.role == "customer")

    def add_message(self, role: str, content: str) -> ConversationMessage:
        msg = ConversationMessage(
            role=role,
            content=content,
            turn_index=self.turn_index,
        )
        self.history.append(msg)
        return msg

    def record_sentiment(self, sentiment_point: SentimentJourneyPoint) -> None:
        self.turn_sentiments.append(sentiment_point)

    def record_escalation(self, moment: EscalationMoment) -> None:
        self.escalation_moments.append(moment)

    def record_kb_upload(self, upload: KBUploadRecord) -> None:
        self.kb_uploads.append(upload)

    def end_session(self) -> None:
        self.ended_at = time.time()

    @property
    def duration_seconds(self) -> Optional[int]:
        if self.ended_at:
            return int(self.ended_at - self.created_at)
        return None

    def get_history_text(self) -> str:
        """Format conversation history as plain text for LLM prompts."""
        lines = []
        for msg in self.history:
            speaker = "Customer" if msg.role == "customer" else "Agent"
            lines.append(f"{speaker}: {msg.content}")
        return "\n".join(lines)


# ─── Global Store ─────────────────────────────────────────────────────────────

_sessions: Dict[str, Session] = {}


def create_session(**kwargs: Any) -> Session:
    session = Session(**kwargs)
    _sessions[session.session_id] = session
    return session


def get_session(session_id: str) -> Optional[Session]:
    return _sessions.get(session_id)


def delete_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


def list_sessions() -> List[str]:
    return list(_sessions.keys())
