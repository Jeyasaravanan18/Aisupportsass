"""
main.py — FastAPI application entrypoint.
Defines all API routes: sessions, KB upload, turn processing, WebSocket, and report.
"""

from __future__ import annotations
import asyncio
import json
import os
import time
from typing import Any, Dict

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from config import ALLOWED_ORIGINS, KB_DIR
from models import (
    InteractionMode,
    KBUploadResponse,
    KBUploadRecord,
    PerformanceReport,
    SessionCreateRequest,
    SessionCreateResponse,
    TurnRequest,
    TurnResult,
)
from session_store import create_session, get_session
from orchestrator import process_turn, process_manual_turn
from rag.ingestion import ingest_default_knowledge_base, ingest_text
from agents.summary_agent import generate_report

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Support Coaching Assistant",
    description="Real-time multi-agent coaching platform for customer support agents",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections keyed by session_id
_ws_connections: Dict[str, WebSocket] = {}
_kb_upload_log: list[KBUploadRecord] = []


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Ingest the bundled knowledge base on startup."""
    print("[startup] Ingesting default knowledge base...")
    try:
        loop = asyncio.get_event_loop()
        count = await loop.run_in_executor(None, ingest_default_knowledge_base)
        print(f"[startup] Knowledge base ready — {count} chunks indexed.")
    except Exception as e:
        print(f"[startup] Warning: KB ingestion failed: {e}")


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── Sessions ─────────────────────────────────────────────────────────────────

@app.post("/sessions/create", response_model=SessionCreateResponse)
async def create_session_endpoint(req: SessionCreateRequest):
    """Create a new coaching session."""
    session = create_session(
        mode=req.mode,
        agent_name=req.agent_name,
        product_context=req.product_context,
        customer_scenario=req.customer_scenario,
        persona_frustration=req.persona_frustration,
        persona_verbosity=req.persona_verbosity,
        replay_transcript=req.replay_transcript,
    )
    return SessionCreateResponse(
        session_id=session.session_id,
        mode=session.mode,
        message=f"Session created in {session.mode.value} mode. Ready to begin.",
    )


@app.get("/sessions/{session_id}")
async def get_session_info(session_id: str):
    """Get current session state."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session.session_id,
        "mode": session.mode,
        "agent_name": session.agent_name,
        "product_context": session.product_context,
        "customer_scenario": session.customer_scenario,
        "turn_index": session.turn_index,
        "history_length": len(session.history),
        "replay_messages_total": len(session.replay_messages),
        "replay_index": session.replay_index,
        "replay_total_lines": session.replay_total_lines,
        "replay_customer_lines": session.replay_customer_lines,
        "replay_agent_lines": session.replay_agent_lines,
        "replay_parse_issues": session.replay_parse_issues,
        "kb_upload_count": len(session.kb_uploads),
        "kb_uploads": [u.model_dump() for u in session.kb_uploads],
    }


@app.get("/kb/uploads")
async def list_kb_uploads():
    return {"uploads": [u.model_dump() for u in _kb_upload_log]}


# ─── Knowledge Base ───────────────────────────────────────────────────────────

@app.post("/kb/upload", response_model=KBUploadResponse)
async def upload_kb_file(file: UploadFile = File(...)):
    """Upload a PDF or text file to the knowledge base."""
    allowed_types = {"text/plain", "application/pdf"}
    if file.content_type not in allowed_types and not (
        file.filename.endswith(".txt") or file.filename.endswith(".pdf")
    ):
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported.")

    contents = await file.read()

    try:
        if file.filename.endswith(".pdf"):
            import fitz
            import tempfile
            import os
            
            fd, temp_path = tempfile.mkstemp(suffix=".pdf")
            with os.fdopen(fd, 'wb') as f:
                f.write(contents)
            
            try:
                doc = fitz.open(temp_path)
                text = "\n".join(page.get_text() for page in doc)
                doc.close()
            finally:
                try:
                    os.remove(temp_path)
                except OSError:
                    pass
        else:
            text = contents.decode("utf-8", errors="replace")

        loop = asyncio.get_event_loop()
        count = await loop.run_in_executor(
            None,
            ingest_text,
            text,
            file.filename,
            "global_kb",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
    finally:
        await file.close()

    upload_record = KBUploadRecord(
        filename=file.filename,
        chunks_indexed=count,
        uploaded_at=time.time(),
        status="indexed" if count > 0 else "empty",
    )
    _kb_upload_log.append(upload_record)

    return KBUploadResponse(
        message=f"Successfully ingested '{file.filename}'",
        chunks_indexed=count,
        filename=file.filename,
    )


# ─── Turn Processing ──────────────────────────────────────────────────────────

@app.post("/turn", response_model=TurnResult)
async def process_turn_endpoint(req: TurnRequest):
    """
    Process one coaching turn.
    - Simulator mode: generates customer message automatically
    - Manual mode: req.agent_message is the customer's message typed by the user
    - Replay mode: steps through replay transcript
    """
    session = get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        if session.mode == InteractionMode.MANUAL:
            if not req.agent_message:
                raise HTTPException(
                    status_code=400,
                    detail="Manual mode requires 'agent_message' containing the customer's message."
                )
            # In manual mode: agent_message field carries the CUSTOMER message text
            # (naming is a bit confusing — it's the text the agent is inputting on behalf of the customer)
            result = await process_manual_turn(
                session=session,
                customer_message=req.agent_message,
                agent_reply=None,
            )
        else:
            result = await process_turn(session=session)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

    # Push via WebSocket if connected
    ws = _ws_connections.get(req.session_id)
    if ws:
        try:
            await ws.send_text(result.model_dump_json())
        except Exception:
            pass  # WS may have disconnected

    return result


@app.post("/turn/agent-reply")
async def record_agent_reply(session_id: str, agent_reply: str):
    """Record the agent's actual reply to the last customer message."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.history and session.history[-1].role == "customer":
        msg = session.add_message("agent", agent_reply)
        return {"recorded": True, "turn_index": msg.turn_index}

    return {"recorded": False, "reason": "Last message was not from customer"}


# ─── Post-Interaction Report ──────────────────────────────────────────────────

@app.get("/report/{session_id}", response_model=PerformanceReport)
async def get_report(session_id: str):
    """Generate the post-interaction performance report for a session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.history:
        raise HTTPException(status_code=400, detail="No conversation history to report on.")

    session.end_session()

    try:
        loop = asyncio.get_event_loop()
        report = await loop.run_in_executor(
            None,
            generate_report,
            session.session_id,
            session.agent_name,
            session.product_context,
            session.customer_scenario,
            session.mode,
            list(session.history),
            list(session.turn_sentiments),
            list(session.escalation_moments),
            session.duration_seconds,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    return report


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket for real-time coaching push updates."""
    session = get_session(session_id)
    if not session:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    _ws_connections[session_id] = websocket
    try:
        while True:
            # Keep connection alive; actual data is pushed from /turn endpoint
            data = await websocket.receive_text()
            # Handle ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        _ws_connections.pop(session_id, None)
