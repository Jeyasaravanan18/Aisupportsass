"""
orchestrator.py — Multi-agent pipeline orchestrator.
Coordinates all agents for each conversation turn.
"""

from __future__ import annotations
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List

from models import (
    TurnResult,
    ConversationMessage,
    SentimentJourneyPoint,
    EscalationMoment,
    InteractionMode,
)
from session_store import Session
from agents import simulator, intent_sentiment, knowledge_agent, coaching_agent, escalation_agent


# Thread pool for running sync Gemini calls
_executor = ThreadPoolExecutor(max_workers=8)


def _run_in_thread(func, *args):
    """Run a blocking function in a thread pool and return an awaitable."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(_executor, func, *args)


async def process_turn(
    session: Session,
    agent_message_override: str | None = None,
) -> TurnResult:
    """
    Execute one full turn of the coaching pipeline:
    1. Get/record the customer message (via mode)
    2. Run Intent & Sentiment + Knowledge RAG in parallel
    3. Run Coaching + Escalation in parallel (after step 2)
    4. Update session state
    5. Return TurnResult

    Args:
        session: The current Session object.
        agent_message_override: If provided, record as agent's previous reply first
                                 (used in Manual/Replay modes).
    Returns:
        TurnResult with all agent outputs.
    """

    # ── Step 0: Record agent message (if Manual/Replay) ──────────────────────
    if agent_message_override and session.history:
        # Only add if agent hasn't already replied to last customer message
        last = session.history[-1]
        if last.role == "customer":
            session.add_message("agent", agent_message_override)

    # ── Step 1: Get customer message ──────────────────────────────────────────
    if session.mode == InteractionMode.SIMULATOR:
        customer_message = await _run_in_thread(
            simulator.generate_customer_message,
            session.customer_scenario,
            session.product_context,
            session.persona_frustration,
            session.persona_verbosity,
            list(session.history),
        )

    elif session.mode == InteractionMode.REPLAY:
        if session.replay_index >= len(session.replay_messages):
            raise ValueError("Replay transcript exhausted — no more customer messages.")
        customer_message = session.replay_messages[session.replay_index]
        session.replay_index += 1

    else:  # MANUAL — customer message must be in history already OR passed as first arg
        # In manual mode, the frontend sends the customer message directly in the turn request
        # It arrives as agent_message_override=None and the last message is already customer
        if session.history and session.history[-1].role == "customer":
            customer_message = session.history[-1].content
        else:
            raise ValueError("Manual mode requires a customer message to be sent first.")

    # Add customer message to history (for Simulator and Replay)
    if session.mode in (InteractionMode.SIMULATOR, InteractionMode.REPLAY):
        session.add_message("customer", customer_message)

    current_history = list(session.history)
    turn_idx = session.turn_index - 1  # turn_index incremented after add_message

    # ── Step 2: Intent/Sentiment + Knowledge in parallel ─────────────────────
    intent_future = _run_in_thread(
        intent_sentiment.analyze,
        customer_message,
        current_history,
    )
    # Run both concurrently; knowledge needs intent result so we chain below
    intent_result = await intent_future

    knowledge_future = _run_in_thread(
        knowledge_agent.recommend,
        customer_message,
        intent_result,
        current_history,
    )

    # ── Step 3: Coaching + Escalation in parallel (both depend on intent) ────
    escalation_future = _run_in_thread(
        escalation_agent.assess,
        customer_message,
        intent_result,
        current_history,
    )

    knowledge_articles = await knowledge_future
    coaching_future = _run_in_thread(
        coaching_agent.coach,
        customer_message,
        session.product_context,
        intent_result,
        knowledge_articles,
        current_history,
    )

    coaching_result, escalation_result = await asyncio.gather(
        coaching_future, escalation_future
    )

    # ── Step 4: Record analytics ──────────────────────────────────────────────
    sentiment_point = SentimentJourneyPoint(
        turn_index=turn_idx,
        sentiment_score=intent_result.sentiment_score,
        sentiment_label=intent_result.sentiment_label,
        customer_message_preview=customer_message[:80],
    )
    session.record_sentiment(sentiment_point)

    if escalation_result.risk_score >= 50:
        session.record_escalation(EscalationMoment(
            turn_index=turn_idx,
            risk_score=escalation_result.risk_score,
            customer_message_preview=customer_message[:80],
        ))

    # ── Step 5: Assemble result ───────────────────────────────────────────────
    return TurnResult(
        session_id=session.session_id,
        turn_index=turn_idx,
        customer_message=customer_message,
        intent_sentiment=intent_result,
        knowledge_articles=knowledge_articles,
        coaching=coaching_result,
        escalation=escalation_result,
        conversation_history=list(session.history),
    )


async def process_manual_turn(
    session: Session,
    customer_message: str,
    agent_reply: str | None,
) -> TurnResult:
    """
    Handle a Manual mode turn:
    - Record agent reply (if provided) to previous customer message
    - Record new customer message
    - Run full pipeline
    """
    # Record agent reply to PREVIOUS customer message
    if agent_reply and session.history and session.history[-1].role == "customer":
        session.add_message("agent", agent_reply)

    # Record the new customer message
    session.add_message("customer", customer_message)

    return await process_turn(session)
