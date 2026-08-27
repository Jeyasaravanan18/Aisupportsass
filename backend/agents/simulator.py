"""
simulator.py — Customer Simulator Agent (OpenRouter).
"""

from __future__ import annotations
from typing import List

from config import call_llm
from models import ConversationMessage


def generate_customer_message(
    customer_scenario: str,
    product_context: str,
    persona_frustration: int,
    persona_verbosity: str,
    history: List[ConversationMessage],
) -> str:
    frustration_desc = {
        1: "very calm, patient, and polite",
        2: "slightly concerned but still friendly",
        3: "moderately frustrated and expects a prompt solution",
        4: "quite frustrated and showing impatience",
        5: "very angry, threatening to cancel or escalate",
    }[persona_frustration]

    history_text = "\n".join(
        f"{'Customer' if m.role == 'customer' else 'Agent'}: {m.content}"
        for m in history
    )
    turn_number = sum(1 for m in history if m.role == "customer") + 1

    system = (
        "You are a Customer Simulator for a support coaching platform. "
        "Generate realistic, emotionally authentic customer messages. "
        "Stay in character. Output ONLY the customer's message text — no labels, no quotes."
    )

    prompt = f"""CONTEXT:
- Product/Service: {product_context}
- Customer Problem: {customer_scenario}
- Customer Emotional State: {frustration_desc}
- Verbosity: {persona_verbosity} (brief=1-2 sentences, moderate=3-4, detailed=5+)
- Turn: {turn_number}

CONVERSATION SO FAR:
{history_text if history_text else "(This is the first message — customer is initiating contact.)"}

Generate the customer's next message:"""

    return call_llm(prompt, system=system, temperature=0.85)
