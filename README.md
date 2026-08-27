# AI-Powered Customer Support Coaching Assistant

A real-time, multi-agent AI platform that coaches customer service agents **during live support interactions** — with instant sentiment analysis, RAG-powered knowledge recommendations, escalation detection, and post-session performance reports.

---

## ✨ Features

| Feature | Details |
|---|---|
| **3 Interaction Modes** | Simulator (AI customer), Manual (paste messages), Replay (transcript upload) |
| **6 AI Agents** | Simulator · Intent/Sentiment · Knowledge RAG · Coaching · Escalation · Summary |
| **Real-Time Coaching** | Suggested responses, tone score, improvement tips per turn |
| **RAG Knowledge Base** | Upload PDFs/TXT files; indexed with sentence-transformers embeddings in ChromaDB |
| **Escalation Alerts** | Risk scoring 0-100 with reasoning and de-escalation strategy |
| **Post-Session Report** | Sentiment journey chart, resolution quality score, coaching recommendations |

---

## 🏗️ Architecture

```
Frontend (Next.js 14)  ←→  Backend (FastAPI)  ←→  OpenRouter (Free LLMs)
                                   ↕
                            ChromaDB (RAG)
                       sentence-transformers embeddings
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free **OpenRouter API key** — [get one at openrouter.ai/keys](https://openrouter.ai/keys)

### 1. Set up environment

```bash
cp .env.example .env
# Edit .env and set your OPENROUTER_API_KEY
```

### 2. Run the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will automatically ingest the bundled knowledge base on startup.

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

### Docker (One-command start)

```bash
cp .env.example .env
# Set OPENROUTER_API_KEY in .env
docker-compose up --build
```

Both services start automatically. Frontend waits for backend health check to pass before starting.

---

## 📁 Project Structure

```
aisupportass/
├── .env.example             # Copy to .env and fill in your key
├── docker-compose.yml       # One-command Docker deployment
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── config.py            # OpenRouter client config + embeddings
│   ├── models.py            # Pydantic data models
│   ├── session_store.py     # In-memory session state
│   ├── orchestrator.py      # Multi-agent pipeline
│   ├── rag/
│   │   ├── ingestion.py     # PDF/TXT → ChromaDB
│   │   └── retriever.py     # Similarity search
│   ├── agents/
│   │   ├── simulator.py         # Customer Simulator Agent
│   │   ├── intent_sentiment.py  # Intent & Sentiment Agent
│   │   ├── knowledge_agent.py   # Knowledge RAG Agent
│   │   ├── coaching_agent.py    # Coaching & Response Agent
│   │   ├── escalation_agent.py  # Escalation Risk Agent
│   │   └── summary_agent.py     # Post-Interaction Summary Agent
│   └── knowledge_base/          # Default KB documents
│       ├── sample_faqs.txt
│       └── sample_policy.txt
└── frontend/
    ├── app/
    │   ├── session/page.tsx     # 3-panel coaching console
    │   └── report/[id]/page.tsx # Post-session report
    └── components/
        ├── SessionConfigModal   # Setup wizard
        ├── ConversationPanel    # Chat thread
        ├── CoachingPanel        # AI coaching feed
        ├── KnowledgePanel       # RAG articles
        ├── EscalationAlert      # Risk overlay
        ├── AgentInput           # Input / Next Turn
        └── ReportView           # Analytics report
```

---

## 🤖 Agent Details

### 1. Customer Simulator Agent
- Generates realistic, scenario-consistent customer messages using OpenRouter
- Configurable frustration level (1-5) and verbosity (brief/moderate/detailed)
- Evolves emotionally across the conversation

### 2. Intent & Sentiment Analysis Agent
- Identifies customer intent and emotional state per message
- Returns frustration level (1-5), satisfaction trend, and sentiment score (-1 to +1)

### 3. Knowledge Recommendation Agent (RAG)
- Builds enriched queries from customer message + detected intent
- Retrieves top-3 relevant articles from ChromaDB using local sentence-transformers embeddings

### 4. Coaching & Response Suggestion Agent
- Generates a complete, empathetic suggested response incorporating KB content
- Scores tone quality (1-10) and provides improvement tips

### 5. Escalation Risk Monitor Agent
- Scores escalation likelihood (0-100) with explicit reasoning
- Triggers an alert overlay when risk ≥ 70

### 6. Post-Interaction Summary Agent
- Generates session summary, sentiment journey, and resolution quality breakdown
- Provides personalized coaching recommendations and knowledge gap analysis

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/sessions/create` | Create a new coaching session |
| `GET` | `/sessions/{id}` | Get session state |
| `POST` | `/turn` | Process one conversation turn |
| `POST` | `/kb/upload` | Upload KB document (PDF/TXT) |
| `GET` | `/report/{id}` | Generate post-session report |
| `WS` | `/ws/{id}` | WebSocket for real-time push |
| `GET` | `/health` | Health check |

---

## 🛠️ Tech Stack

- **Backend**: FastAPI · Python 3.11 · OpenRouter (free LLMs via OpenAI-compatible API) · ChromaDB · sentence-transformers · PyMuPDF
- **Frontend**: Next.js 14 · TypeScript · Tailwind CSS · Framer Motion
- **Infrastructure**: Docker · Docker Compose

---

## 📊 Evaluation Criteria Coverage

| Criterion | Implementation |
|---|---|
| Simulator realism | Prompt-engineered personas with emotional progression via OpenRouter |
| Sentiment accuracy | Structured JSON output with frustration (1-5) + trend + label |
| RAG relevance | sentence-transformers (all-MiniLM-L6-v2) + cosine similarity in ChromaDB |
| Coaching usefulness | KB-grounded response suggestions + actionable tips |
| Report quality | Sentiment journey + quality breakdown rings |
| Completeness | All 6 agents, 7 modules, 3 modes, Docker deployment |

---

## 📝 License

MIT — Built for Vidzai Digital / Infosys Internship Project
