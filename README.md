
# 🌌 Cosmo AI — Your All-in-One AI Assistant

> One API key. Infinite capability. A premium, production-grade AI workspace — not just another chatbot.

---

## 💡 Inspiration

Every AI chat app makes you juggle API keys, forgets your documents, and looks like a Slack clone with a text box. We wanted **one clean login → paste one key → get a full AI workstation**: real-time streaming, a talking AI presence, document intelligence, and memory that persists — wrapped in an interface that feels like it belongs in 2030, not a weekend script.

## 🚀 What it does

- **Single-key setup.** Paste one Anthropic API key, we validate it live, encrypt it at rest, and every feature just works. No provider zoo to configure.
- **Local-first fallback.** If Ollama is running on your machine, Cosmo auto-detects it and lets you flip a toggle to route requests locally — free, private, offline-capable — with zero extra setup. Not required, just there if you want it.
- **Real-time streaming chat** over WebSockets with markdown rendering, syntax-highlighted code blocks, and a live "thinking" indicator.
- **Document intelligence (RAG).** Drag a PDF into the chat (or upload from the sidebar) and Cosmo chunks, embeds, and indexes it locally with Chroma — then grounds its answers in your document, citing context instead of hallucinating.
- **An AI that feels present.** The right-hand panel renders a glowing, pulsing avatar orb with a live waveform that reacts as Cosmo thinks, streams, and speaks its answer aloud via text-to-speech.
- **Long-term memory.** Every conversation is persisted, searchable, and recallable — Redis caches the active session window for snappy context, Postgres holds the permanent record.
- **Real accounts.** Full registration with name/email/username/password — no demo credentials, no shared logins. Your profile and avatar show up in the sidebar the moment you sign in.

## 🏗️ How we built it

**Frontend:** React 18 + Vite + Tailwind CSS. A glassmorphic black/graphite/metallic-gold design system, three-panel layout (sidebar / chat workspace / avatar panel), WebSocket-driven streaming UI, `react-markdown` + `react-syntax-highlighter` for rich responses, `react-dropzone` for drag-and-drop PDFs, Web Speech API for TTS.

**Backend:** Python FastAPI, structured with Clean Architecture layering (`api` → `services` → `models`/`db`), so each concern is swappable:
- **Auth:** JWT access/refresh tokens, bcrypt password hashing, Fernet-encrypted API key storage.
- **AI Adapter Layer:** an `AIProviderAdapter` interface with an `AnthropicAdapter` and `OllamaAdapter` behind a single factory function — the rest of the app never knows or cares which one is active. Adding a new provider later is a ~40-line adapter, not a rewrite.
- **RAG:** PyPDF text extraction → chunking → local embedding (Chroma's built-in embedder, so RAG never spends your LLM key) → similarity retrieval injected into the system prompt.
- **Memory:** Redis rolling context window per conversation + Postgres as the durable source of truth.
- **Real-time:** a single `/ws/chat` WebSocket endpoint drives the entire conversational loop — receive → persist → resolve adapter → stream tokens → persist assistant reply.
- **Data:** PostgreSQL (SQLAlchemy async ORM), Redis, Chroma (embedded — zero extra infra to stand up for a demo).

## 🧗 Challenges we ran into

- Keeping the "one API key" promise honest while still supporting a pluggable multi-provider future — solved with the adapter + factory pattern so switching is a config value, not a code change.
- Making local Ollama fallback feel seamless rather than bolted on — health-checked automatically, degrades gracefully to the cloud key if it's not actually reachable.
- Getting believable "AI presence" (avatar + waveform + TTS) without shipping a heavy video/animation pipeline — solved with pure CSS/SVG-driven motion synced to WebSocket lifecycle events (`thinking` → `stream_start` → `token` → `stream_end`) plus the browser's native Speech Synthesis API.

## 🏆 Accomplishments we're proud of

A genuinely full-stack, end-to-end system in one build: real auth, real streaming, real RAG, real persistence — running behind a UI that doesn't look like a template.

## 🔮 What's next

- Additional provider adapters (OpenAI, Gemini) behind the same interface — no user-facing complexity added.
- Multi-document cross-referencing and citation highlighting in the chat.
- Voice **input** (not just output) for a fully hands-free assistant loop.

---

## ⚡ Quickstart (judges / demo)

Cosmo AI runs entirely natively — no containers required. You just need Postgres and Redis installed locally (or reachable from your machine).

### 1. Install and start Postgres + Redis

```bash
# macOS (Homebrew)
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis

# Ubuntu/Debian
sudo apt install postgresql redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server
```

Create the database once:
```bash
createdb cosmo_ai
# or: psql -U postgres -c "CREATE DATABASE cosmo_ai;"
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # edit DATABASE_URL/REDIS_URL if needed
uvicorn app.main:app --reload
```
Tables are created automatically on first run (dev mode). To use Alembic migrations instead:
```bash
alembic upgrade head
```

Optional — seed a ready-to-use demo account (`demo` / `Demo12345!`):
```bash
python -m scripts.seed_demo_user
```

Backend runs at http://localhost:8000 · API docs at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173 (Vite proxies `/api` and `/ws` to the backend automatically).

### 4. (Optional) Local Ollama fallback
```bash
ollama serve
ollama pull llama3.1
```
Cosmo auto-detects it and shows a toggle in the sidebar — no other setup needed.

### Demo script (2 minutes)
1. Register a real account (name/email/username/password) → land straight in the workspace.
2. Paste an Anthropic API key into **AI Engine** in the sidebar → watch it validate live.
3. Ask Cosmo something → watch tokens stream in with the avatar lighting up and speaking the answer.
4. Drag a PDF into the chat → ask a question about it → watch Cosmo ground its answer in the document.
5. (Optional) Start Ollama locally (`ollama serve`) → refresh → flip the "Use local Ollama" toggle → same chat, now running fully offline.

## 📂 Architecture at a glance

```
cosmo-ai/
├── backend/            FastAPI, Clean Architecture (api → services → models/db)
│   └── app/
│       ├── api/routes/     auth, chat, documents, ws_chat
│       ├── services/ai/    adapter interface + Anthropic + Ollama + factory
│       ├── services/rag/   PDF chunking, Chroma vector store, prompt builder
│       ├── services/memory/  Redis rolling context
│       └── models/         User, Conversation, Message, Document
├── frontend/           React + Vite + Tailwind
│   └── src/
│       ├── components/     Sidebar, ChatWorkspace, AvatarPanel, MarkdownMessage
│       ├── pages/           Login, Register, Workspace
│       ├── hooks/           useChatSocket (WebSocket streaming)
│       └── context/         AuthContext
├── backend/.env.example  Environment variable template
└── README.md
```

## 🔐 Environment variables

See `backend/.env.example`. At minimum for a demo: `SECRET_KEY`, `ENCRYPTION_KEY`, `DATABASE_URL`, `REDIS_URL`. No AI provider key goes in `.env` — that's entered per-user, encrypted, through the UI, by design.

