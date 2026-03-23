# TutorAI - Fix Checklist

Last audited: 2026-03-23

---

## 1. Security

### 1.1 Restrict CORS to known origins
- [x] Import `cors` options in `server/index.js`
- [x] Replace `app.use(cors())` with `app.use(cors({ origin: process.env.CLIENT_URL }))`
- [x] Add `CLIENT_URL=http://localhost:5173` to `server/.env.example`
- [ ] Add `CLIENT_URL=https://your-frontend.vercel.app` to Render env vars on deploy

### 1.2 Rate-limit auth routes
- [x] Install `express-rate-limit` -> `npm i express-rate-limit`
- [x] Create a limiter: 20 requests per 15 minutes
- [x] Apply limiter to `/api/auth` in `server/index.js`
- [x] (Optional) Add a stricter 5-req limiter to `/api/auth/login` specifically

### 1.3 Move JWT out of localStorage
- [x] Switch to `httpOnly` + `Secure` cookies on the server (set via `res.cookie`)
- [x] Remove `localStorage.setItem('token', ...)` from `AuthContext.jsx`
- [x] Update `authMiddleware.js` to read token from `req.cookies` instead of `Authorization` header
- [x] Install `cookie-parser` -> `npm i cookie-parser`, register in `server/index.js`
- [x] Add a `POST /api/auth/logout` route that clears the cookie
- [x] Update frontend fetch calls to include `credentials: 'include'`

### 1.4 Fix JWT error status code
- [x] In `server/middleware/authMiddleware.js`, change the invalid-token response from `403` to `401`

### 1.5 Add password strength validation
- [x] In `server/routes/auth.js` register route, check `password.length >= 8`
- [x] Return `400` with a clear message if too short
- [x] Add matching validation on the frontend in `Signup.jsx` before the fetch call

---

## 2. Backend Reliability

### 2.1 Wrap history GET routes in try/catch
- [x] In `server/routes/chat.js`, wrap `GET /history` in try/catch, return `500` on error
- [x] Wrap `GET /history/:id` in try/catch
- [x] Do the same for `GET /api/quiz/history` and `GET /api/pdf/history` if unhandled

### 2.2 Validate ObjectId before DB lookup
- [x] In `server/routes/chat.js` POST route, check `mongoose.Types.ObjectId.isValid(sessionId)` before calling `findById`/query
- [x] Return `400` with `Invalid session ID` if invalid
- [x] Apply the same guard in any other route that accepts an `:id` param

### 2.3 Fix ReDoS vulnerability in RAG retriever
- [x] In `server/rag/retriever.js`, escape keywords before building the regex
- [x] Replace `keywords.join('|')` with `keywords.map(k => k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')`

### 2.4 Guard the seeder script against production runs
- [x] At the top of `server/rag/seeder.js`, add a check: `if (process.env.NODE_ENV === 'production') process.exit(1)`
- [x] Add a note in the README warning not to run seeder in production

### 2.5 Add pagination to history endpoints
- [ ] Accept `page` and `limit` query params in `GET /api/chat/history`
- [ ] Apply `.limit(limit).skip((page - 1) * limit)` to the Mongoose query
- [ ] Return total count alongside results so the frontend can show page info
- [ ] Apply the same pattern to quiz and PDF history routes

---

## 3. Frontend Bugs

### 3.1 Standardise the onChange pattern across auth pages
- [x] In `Signin.jsx`, confirm all inputs use `name` attribute and `e.target.name` in `handleChange`
- [x] In `Signup.jsx`, confirm all inputs use `name` attribute and `e.target.name` in `handleChange`
- [x] Pick one pattern and align both files - prefer `name` + `e.target.name` (more conventional)

### 3.2 Surface quiz save errors to the user
- [x] In `Quiz.jsx`, replace `.catch(() => {})` on the save fetch with a handler that sets an error state
- [x] Show a small non-blocking toast or banner: `Your result couldn't be saved`

### 3.3 Remove or implement non-functional UI elements
- [x] Google OAuth button - either wire up OAuth (see bonus below) or remove the button from both `Signin.jsx` and `Signup.jsx`
- [x] Forgot password link - either build a reset flow or remove/disable the link for now

### 3.4 Fix stale useEffect deps in Quiz
- [x] In `Quiz.jsx`, add `initialTopic` and `sessionId` (via `useRef` or direct values) to the `useEffect` dependency array
- [x] Alternatively, add an `// eslint-disable-next-line` comment with a clear explanation if intentionally run-once

---

## 4. RAG Quality

### 4.1 Expand the knowledge base
- [x] Add at least 3-5 more documents per subject (currently 2-3 each)
- [ ] Add new subjects: Geography, Economics, Literature, or Computer Science deeper topics
- [x] Keep each document focused on one concept (~150-300 words) for better retrieval precision

### 4.2 Implement document chunking
- [x] Split longer documents into ~200-word chunks at the seeder stage
- [x] Store `chunkIndex` and `sourceTitle` fields on each chunk document
- [x] Update `formatContext` in `retriever.js` to label chunks by source title + chunk index

### 4.3 Improve retrieval with embeddings (longer-term)
Decision: Deferred by choice. Do not implement in current scope.

- [ ] Research embedding providers compatible with your stack (Groq does not offer embeddings - consider OpenAI `text-embedding-3-small` or a free alternative like Nomic)
- [ ] Store a `vector` field on each Document in MongoDB
- [ ] On retrieval, embed the query and compute cosine similarity against stored vectors
- [ ] Replace or augment the `$text` search with vector ranking

---

## 5. Bonus / Nice-to-Have

- [ ] Implement Google OAuth via Passport.js or Auth0
- [x] Add a password reset flow (email token via Nodemailer)
- [ ] Stream AI responses token-by-token using Server-Sent Events for a better chat UX
- [x] Add a user profile page showing quiz history and generated PDFs
- [x] Add a global Express error handler middleware to catch any unhandled errors uniformly
