# TutorAI — AI-Powered Learning Platform

> A production-grade AI tutoring application featuring real-time streaming chat, adaptive quiz generation, formatted PDF assignments, and a RAG-powered knowledge engine — built with React 19, Express 5, MongoDB, and the Groq API.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org) [![React](https://img.shields.io/badge/React-19-blue)](https://react.dev) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)](https://mongodb.com) [![License](https://img.shields.io/badge/License-ISC-lightgrey)](LICENSE)

---

## Why This Project Stands Out

- **Real-time AI streaming (SSE)** — token-by-token responses via Server-Sent Events, not fake loaders
- **RAG-powered reasoning** — context-aware answers grounded in an indexed knowledge base
- **Adaptive difficulty engine** — system evolves based on user performance across the session
- **Context-aware quiz generation** — questions derived from actual conversation history
- **Dynamic PDF generation** — structured, multi-type assignments rendered server-side with coordinate-based layout
- **Production-grade backend** — JWT auth, password reset, rate limiting, observability metrics

---

## System Architecture

```
User → React Frontend → Express API → Groq LLM
                              ↓
                       RAG Engine (MongoDB)
                              ↓
                    Context Injection Layer
                              ↓
                   Streaming Response (SSE)
```

### Key Flows

**Chat Flow**
1. User sends message → `POST /stream-init` registers message, returns `streamId`
2. Client opens `GET /stream/:streamId` SSE connection
3. RAG retrieves top-k matching knowledge chunks → injected into system prompt
4. LLM response streamed token-by-token → stored in conversation history

**Quiz Flow**
1. Pull last 6 chat messages from active session
2. Generate 5 MCQs (2 easy, 2 medium, 1 hard)
3. Evaluate answers + serve per-question AI explanations via LLM

**Assignment Flow**
1. User selects topic, grade level, and assignment type
2. Prompt → structured LLM output via `llama-3.3-70b-versatile`
3. PDF rendered server-side using coordinate-based layout engine → streamed as binary

---

## Feature Deep-Dive

### AI Chat

**SSE Streaming** — the client calls `POST /stream-init` to register a message and receive a `streamId`, then opens a `GET /stream/:streamId` SSE connection. Pending streams are stored in a server-side Map with a 2-minute TTL and cleaned on every request.

**RAG Context Injection** — every message triggers a MongoDB full-text search before the Groq call. The top 3 matching document chunks are labelled and injected into the system prompt automatically. A keyword-regex fallback fires when the text search returns nothing.

**Adaptive Difficulty** — the backend classifies each student reply as `low`, `medium`, or `high` quality based on word count and domain signal keywords, then shifts the `followUpDifficulty` field on the session (`easy → medium → hard`). This persists across the conversation so questions genuinely get harder as the student improves.

**Full Conversation History** — all prior messages from the session are passed to Groq on every turn so context is maintained across a long study session.

**Session Persistence** — messages, session ID, and topic are saved to `localStorage` and restored on hard refresh. New Chat cleanly wipes everything.

**Deep-link to Quiz** — the "Quiz on [topic]" header button navigates to `/quiz?topic=...&sessionId=...` so the quiz pulls the actual chat context for more relevant questions.

---

### Quiz Module

**Context-aware generation** — if launched from chat, the quiz pulls the last 6 messages of the active session as authoritative context. Questions are directly about what was just discussed.

**5 MCQs per attempt** — difficulty is varied: 2 easy, 2 medium, 1 hard per set.

**Live answer feedback** — selecting an option immediately highlights correct (green) and wrong (red) answers with the correct answer always shown.

**AI explanation per question** — after each answer, students can request a structured explanation (Direct Answer → Key Points → Example → Related Concept) rendered with React Markdown. The explanation endpoint also calls RAG for additional context.

**Score screen with breakdown** — shows score, percentage, emoji feedback, and a per-question review of all 5 answers with correct answers for any missed questions.

**Quiz result history** — all attempts with scores are saved to MongoDB and displayed in the profile dashboard.

---

### PDF Assignment Generator

Four distinct assignment types, each with a different question structure, Groq prompt, and score label:

| Type | Structure | Score |
|---|---|---|
| **Worksheet** | 2 MCQ + describe + explain + fill-in-blank | / 10 |
| **Essay Assignment** | Warm-up → key terms → compare/contrast → 400–500 word essay + rubric | / 20 |
| **Problem Set** | MCQ + calculation + 3-part problem + scenario + application | / 25 |
| **Comprehension Test** | 3 MCQ (Remember → Understand → Apply) + Analyse + Evaluate — Bloom's taxonomy | / 10 |

Generated by `llama-3.3-70b-versatile` and streamed as a binary PDF. The layout uses explicit coordinate-based rendering to prevent element overlap: styled header band, title band, student info bar, learning objectives, numbered question badges, A/B/C/D option bubbles, answer key with pink accent, and a page-numbered footer via `bufferPages`.

---

### RAG Knowledge Engine

**25 source documents** across 5 topics:
- **Mathematics** — Algebra, Geometry, Calculus, Statistics, Trigonometry
- **Science** — Photosynthesis, Newton's Laws, Periodic Table, Cell Biology, Ecosystems
- **History** — WWII, French Revolution, Industrial Revolution, Cold War, Ancient Civilisations
- **Coding** — JavaScript, Data Structures, Big O, OOP, HTTP/REST
- **English** — Essay Writing, Grammar, Close Reading, Argumentative Writing, Literary Devices

**Document chunking** — the seeder splits each document into 200-word chunks before inserting into MongoDB. Each chunk stores `sourceTitle` and `chunkIndex` so retrieved context is clearly labelled in the system prompt.

**Two-stage retrieval** — MongoDB `$text` search runs first using a compound index on `content`, `title`, and `tags`. If it returns no results, a keyword-regex fallback runs using stopword-filtered query terms. The retriever never throws — it always returns `''` on failure so the Groq call is never blocked.

---

### Authentication & Security

**httpOnly cookie** — JWT is stored in a `sameSite: lax / none` httpOnly cookie named `ai_tutor_token`. It is never readable by JavaScript, eliminating XSS token theft.

**Session restore** — on page load, `GET /api/auth/me` verifies the cookie and restores the user object into React context without a redirect.

**Password reset flow** — `POST /forgot-password` generates a `crypto.randomBytes(32)` raw token, stores the SHA-256 hash in MongoDB with a 30-minute expiry, and sends a reset link via nodemailer. The reset endpoint re-hashes the submitted token to compare against the stored hash.

**Rate limiting** — all `/api/auth/*` routes: 20 requests / 15 minutes. Login endpoint: 5 requests / 15 minutes.

---

### Observability & Metrics

Custom metrics middleware tracks:
- Request volume and status code distribution
- Top 10 routes by request count
- Latency percentiles: p50, p95, max
- 5xx error rate

Endpoints: `GET /health`, `GET /ready` (MongoDB connectivity check), `GET /metrics`.

---

### 3D Landing Page 

- `IcosahedronGeometry` (detail level 24) with `MeshDistortMaterial` — clearcoat, metalness, emissive purple glow
- Counter-rotating wireframe overlay for visual depth
- Bloom postprocessing via `@react-three/postprocessing`
- `Stars` particle field (1800 particles) from `@react-three/drei`
- Lazy-loaded with `React.lazy` + `Suspense` — skipped on mobile (`window.innerWidth < 768`)
- DPR capped at `[1, 1.5]` to limit GPU load on retina screens

---

## Tech Stack

### Frontend

| Tool | Purpose |
|---|---|
| React 19 + Vite 6 | Component framework and build tool |
| React Router DOM 7 | Client-side routing |
| TailwindCSS 3 | Utility-first styling with Midnight Scholar custom palette |
| Framer Motion | Page transitions and staggered animations |
| Three.js + React Three Fiber + Drei | 3D neural orb |
| @react-three/postprocessing | Bloom effect on 3D scene |
| React Markdown + remark-gfm | AI response and explanation rendering |

### Backend

| Tool | Purpose |
|---|---|
| Node.js 18+ + Express 5 | REST API server |
| Mongoose 9 | MongoDB ODM — all models include timestamps and userId indexes |
| Groq SDK | LLM inference (`llama-3.1-8b-instant` for chat/quiz, `llama-3.3-70b-versatile` for PDF) |
| pdfkit 0.18 | Server-side coordinate-based PDF layout |
| bcryptjs | Password hashing (10 salt rounds) |
| jsonwebtoken | JWT signing and verification |
| cookie-parser | httpOnly cookie parsing |
| nodemailer | Password reset emails with SMTP + dev console fallback |
| express-rate-limit | Auth route brute-force protection |
| morgan | HTTP request logging with `x-request-id` tracing |

---

## Project Structure

```
TUTOR-AI/
├── src/                          # React frontend (Vite entry at repo root)
│   ├── components/
│   │   ├── Sidebar.jsx           # Nav with real chat history loaded from API
│   │   └── three/
│   │       ├── BrainMesh.jsx     # Icosahedron + wireframe + Float
│   │       ├── ParticleField.jsx # Stars background
│   │       └── Scene.jsx         # Canvas + lights + OrbitControls + Bloom
│   ├── context/
│   │   └── AuthContext.jsx       # Cookie-based auth, login/logout, /me session restore
│   ├── pages/
│   │   ├── Onboarding.jsx        # Landing page with 3D hero
│   │   ├── Signin.jsx / Signup.jsx
│   │   ├── ForgotPassword.jsx / ResetPassword.jsx
│   │   ├── Chat.jsx              # SSE streaming chat, adaptive difficulty, topic selector
│   │   ├── Quiz.jsx              # 3-phase: input → active question → score screen
│   │   ├── PDFGenerator.jsx      # 4-type assignment generator with history
│   │   └── Profile.jsx           # Activity dashboard
│   ├── App.jsx                   # Routes: PrivateRoute + PublicRoute wrappers
│   └── main.jsx
│
├── server/
│   ├── middleware/
│   │   ├── authMiddleware.js     # Cookie JWT verify → req.user
│   │   └── metrics.js            # In-process metrics (p50/p95 latency, route counts)
│   ├── models/
│   │   ├── User.js               # name, email, password, passwordResetToken, passwordResetExpires
│   │   ├── ChatHistory.js        # messages[], topic, followUpDifficulty
│   │   ├── QuizResult.js         # topic, score, total, questions[]
│   │   ├── Assignment.js         # topic, gradeLevel, assignmentType, content
│   │   └── Document.js           # RAG store: content, title, tags, chunkIndex, sourceTitle
│   ├── routes/
│   │   ├── auth.js               # register, login, logout, /me, forgot-password, reset-password
│   │   ├── chat.js               # stream-init, stream/:id (SSE), POST / (fallback), history
│   │   ├── quiz.js               # generate, explain, save, history
│   │   └── pdf.js                # generate (streams binary PDF), history
│   ├── rag/
│   │   ├── retriever.js          # $text search → regex keyword fallback
│   │   ├── seeder.js             # Splits docs into 200-word chunks, inserts into MongoDB
│   │   └── documents/            # math.json, science.json, history.json, coding.json, english.json
│   ├── services/
│   │   ├── groqClient.js         # Singleton Groq instance
│   │   ├── pdfBuilder.js         # Coordinate-based A4 PDF layout engine
│   │   ├── logger.js             # Structured logger: info / warn / error / fatal
│   │   └── mailer.js             # nodemailer with SMTP + dev jsonTransport fallback
│   ├── index.js                  # App bootstrap: CORS, rate limit, morgan, /health /ready /metrics
│   └── .env.example
│
├── index.html
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite + /api proxy → http://localhost:5000
└── tailwind.config.js            # Midnight Scholar custom colour tokens
```

---

## Getting Started

### Prerequisites

```
node --version   # v18 or higher
npm --version    # v9 or higher
```

You also need:
- A **MongoDB Atlas** account → [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier works)
- A **Groq API key** → [console.groq.com](https://console.groq.com) (free tier, no credit card)

### 1. Clone the repo

```bash
git clone https://github.com/piyushkumar0707/TUTOR-AI.git
cd TUTOR-AI
```

### 2. Install dependencies

```bash
# Frontend — run at repo root
npm install

# Backend
cd server && npm install && cd ..
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai_tutor
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
GROQ_API_KEY=gsk_<your_key_from_console.groq.com>
NODE_ENV=development

# Optional — password reset emails
# Leave blank to use the console fallback (reset URL is printed in server logs)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=TutorAI <no-reply@tutorai.local>
```

> `server/.env` is gitignored and must never be committed.

### 4. Seed the RAG knowledge base

```bash
cd server && node rag/seeder.js && cd ..
```

Expected output:
```
Connected to MongoDB
Cleared existing documents
Seeded N chunks from math.json
Seeded N chunks from science.json
Seeded N chunks from history.json
Seeded N chunks from coding.json
Seeded N chunks from english.json
Seeding complete!
```

> Re-run the seeder any time you add or edit documents in `server/rag/documents/`.

### 5. Run the application

Open two terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
npm run dev
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account, sets httpOnly auth cookie |
| POST | `/login` | — | Sign in (5 req / 15 min rate limit), sets httpOnly auth cookie |
| POST | `/logout` | — | Clears the auth cookie |
| GET | `/me` | 🔒 | Verify session cookie, returns user object |
| POST | `/forgot-password` | — | Sends SHA-256 hashed reset token via email (30-min TTL) |
| POST | `/reset-password` | — | Validates token hash, updates hashed password, clears token |

### Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/stream-init` | 🔒 | Registers message, returns `{ streamId }` (2-min TTL) |
| GET | `/stream/:streamId` | 🔒 | Opens SSE connection, streams Groq response token-by-token |
| POST | `/` | 🔒 | Non-streaming fallback — returns full response in one JSON response |
| GET | `/history` | 🔒 | All chat sessions for the current user (topic + createdAt) |
| GET | `/history/:id` | 🔒 | Full message list for one session |

### Quiz — `/api/quiz`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/generate` | 🔒 | Generates exactly 5 MCQs. Pass `sessionId` to use chat context. |
| POST | `/explain` | 🔒 | Returns structured AI explanation for one question + correct answer |
| POST | `/save` | 🔒 | Saves quiz result to MongoDB |
| GET | `/history` | 🔒 | Last 20 quiz results for the current user |

### PDF — `/api/pdf`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/generate` | 🔒 | Generates and streams a binary PDF (`Content-Type: application/pdf`) |
| GET | `/history` | 🔒 | Last 20 assignment records for the current user |

### Observability

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Always 200. Returns `{ status, timestamp, uptimeSeconds }` |
| GET | `/ready` | 200 if MongoDB is connected, 503 if not |
| GET | `/metrics` | Request totals, status codes, top 10 routes, p50/p95/max latency, 5xx error rate |

---

## Security Notes

- Passwords hashed with bcrypt (10 salt rounds)
- JWT stored in httpOnly cookie — never accessible from JavaScript
- `secure: true` + `sameSite: none` in production; `sameSite: lax` in development
- Password reset tokens stored as SHA-256 hashes — raw token only ever appears in the email link
- Auth routes rate-limited (20/15 min global, 5/15 min on login specifically)
- `x-powered-by` header disabled
- All Groq JSON outputs validated after parsing — malformed responses return a clean 500 with retry guidance rather than crashing

---

## Available Scripts

### Frontend (repo root)

```bash
npm run dev       # Vite dev server on :5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
```

### Backend (`server/`)

```bash
npm run dev         # nodemon with hot reload
npm start           # node index.js (production)
node rag/seeder.js  # Seed / re-seed RAG documents into MongoDB
```

---

## Deployment

### Backend → Render

1. Push repo to GitHub
2. Render → New Web Service → connect repo → Root Directory: `server`
3. Build command: `npm install` — Start command: `node index.js`
4. Add all environment variables from `server/.env`
5. Set `NODE_ENV=production` and `CLIENT_URL=https://your-vercel-app.vercel.app`

### Frontend → Vercel

1. Vercel → New Project → connect repo → Framework: Vite → Root: `/`
2. No additional env vars needed in development (Vite proxy handles `/api`)
3. For production, update `vite.config.js` proxy target to your Render URL

---

## Scaling Considerations

### Current Limitations

| Area | Limitation | Impact |
|---|---|---|
| MongoDB text search | Not semantic — limits retrieval quality at scale | Lower RAG relevance for ambiguous queries |
| SSE connections | In-memory stream registry — not horizontally scalable | Single-instance only |
| PDF generation | CPU-bound pdfkit — may block event loop under high load | Latency spikes under concurrent requests |

### Planned Improvements

- Replace MongoDB text search with a **vector database** (Pinecone / Weaviate / FAISS) for semantic retrieval
- Introduce **Redis** for caching and distributed session storage
- Move PDF generation to a **background queue** (BullMQ / SQS) to offload from the event loop
- Replace SSE with **WebSockets** or a distributed event system for horizontal scaling

---

## Intentional Tradeoffs

- **No test suite** — planned: Jest unit tests + integration tests
- **No TypeScript** — planned migration for end-to-end type safety

---

## License

ISC — free to use and modify.

---

*Built with Groq API · MongoDB Atlas · React 19 · Three.js · Express 5*
*UI designed with the Midnight Scholar aesthetic*

---

Made with ❤️ by **Piyush** 