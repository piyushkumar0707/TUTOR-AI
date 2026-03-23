# TutorAI

TutorAI is a full-stack educational SaaS application that combines AI tutoring, adaptive quiz generation, and assignment PDF creation into one learning workflow.

It is built with React 19 + Vite on the frontend and Express + MongoDB + Groq on the backend, with a premium Midnight Scholar UI and interactive 3D onboarding experience.

## Highlights

- AI Tutor Chat with topic-aware responses and Retrieval Augmented Generation (RAG)
- Adaptive follow-up difficulty in chat sessions
- Quiz generation from topic or active chat session context
- AI explanation for each quiz answer
- Server-side PDF assignment generation and streaming download
- Cookie-based authentication (httpOnly session cookie)
- Forgot/Reset password flow using email tokens
- Profile dashboard with activity history (chat, quiz, PDF)
- Premium onboarding hero with React Three Fiber neural network and Framer Motion animations

## Tech Stack

### Frontend

- React 19
- React Router DOM 7
- Vite 6
- TailwindCSS 3
- Framer Motion
- Three.js + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- React Markdown (GFM + line breaks)

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- Groq SDK
- pdfkit
- bcryptjs
- jsonwebtoken
- cookie-parser
- nodemailer
- express-rate-limit

## Architecture

- Frontend app is at repo root under `src/`
- Backend API is under `server/`
- Knowledge documents are stored in `server/rag/documents/` and seeded into MongoDB
- Frontend calls backend via Vite proxy (`/api -> http://localhost:5000`)
- Auth state is session-driven using secure cookies and `credentials: include`

## Core User Flows

### 1) Authentication and Session Management

- Sign up and sign in set an auth cookie (`ai_tutor_token`)
- Session persistence is restored with `GET /api/auth/me`
- Logout clears auth cookie
- Forgot password issues a time-limited reset token (30 min)
- Reset password validates token and updates hashed password

### 2) AI Tutor Chat

- User selects a topic and starts messaging
- Backend injects retrieved RAG context before calling Groq
- Chat sessions are stored and can be reopened from history
- Follow-up difficulty auto-adjusts based on response quality
- Chat UI supports markdown rendering and a typing indicator

### 3) Quiz Engine

- Generate exactly 5 MCQs from a topic
- Optionally uses latest chat session context for quiz relevance
- Explanation endpoint provides structured reasoning per answer
- Quiz attempts and scores are stored per user
- History is visible in profile and quiz module

### 4) PDF Assignment Generator

- Supports 4 assignment types:
  - Worksheet
  - Essay Assignment
  - Problem Set
  - Comprehension Test
- Uses Groq to generate structured assignment JSON
- Streams final PDF from server using pdfkit (no client-side PDF generation)
- Saves assignment metadata for history cards in UI

### 5) Profile and Navigation

- Sidebar includes recent chat sessions
- Profile page aggregates:
  - chat session count
  - quiz count and average score
  - recent PDFs

## Frontend Pages

- `/` - Onboarding (premium hero + conversion sections)
- `/signup` - Registration
- `/signin` - Login
- `/forgot-password` - Request reset link
- `/reset-password` - Set new password
- `/chat` - AI tutor chat workspace
- `/quiz` - Quiz generation and answer review
- `/pdf` - Assignment PDF generation
- `/profile` - Activity overview

## API Endpoints

### Auth (`/api/auth`)

- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /me`
- `POST /forgot-password`
- `POST /reset-password`

### Chat (`/api/chat`)

- `POST /`
- `GET /history`
- `GET /history/:id`

### Quiz (`/api/quiz`)

- `POST /generate`
- `POST /explain`
- `POST /save`
- `GET /history`

### PDF (`/api/pdf`)

- `POST /generate`
- `GET /history`

## Project Structure

```text
.
|- src/
|  |- components/
|  |  |- PremiumHero.jsx
|  |  |- Sidebar.jsx
|  |  \- three/
|  |- context/
|  |  \- AuthContext.jsx
|  |- pages/
|  |  |- Onboarding.jsx
|  |  |- Signin.jsx
|  |  |- Signup.jsx
|  |  |- ForgotPassword.jsx
|  |  |- ResetPassword.jsx
|  |  |- Chat.jsx
|  |  |- Quiz.jsx
|  |  |- PDFGenerator.jsx
|  |  \- Profile.jsx
|  |- App.jsx
|  \- main.jsx
|- server/
|  |- middleware/
|  |- models/
|  |- routes/
|  |- services/
|  |- rag/
|  |  |- documents/
|  |  |- retriever.js
|  |  \- seeder.js
|  |- index.js
|  \- .env.example
|- package.json
|- vite.config.js
\- README.md
```

## Environment Variables

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai_tutor
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=gsk_your_groq_key_here
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=TutorAI <no-reply@tutorai.local>
NODE_ENV=development
```

Notes:
- If SMTP is not configured, mailer falls back to local json transport and logs reset link in server logs.
- Keep `server/.env` out of version control.

## Local Development

### 1) Install dependencies

```bash
# frontend
npm install

# backend
cd server
npm install
cd ..
```

### 2) Seed RAG documents

```bash
cd server
node rag/seeder.js
cd ..
```

### 3) Run app

```bash
# terminal 1
cd server
npm run dev

# terminal 2
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Available Scripts

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

### Backend

- `npm run dev`
- `npm start`

## Security and Reliability Notes

- Passwords are hashed with bcrypt
- Login/auth routes are rate-limited
- Auth token is stored in httpOnly cookie
- Protected routes use auth middleware on backend
- Structured AI outputs are parsed/validated with fallbacks
- PDF generation happens on server and is streamed to client

## Recent Product Update

The onboarding experience was upgraded to a premium high-conversion hero with:

- Interactive R3F neural network canvas background
- Bloom-heavy violet/pink glow postprocessing
- Framer Motion staggered typography and CTA entrances
- Glassmorphic bento cards and responsive reveal timings



## License

ISC
