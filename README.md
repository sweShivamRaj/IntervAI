# AI-Powered Adaptive Interview Platform

University Software Engineering project — a working full-stack web app where candidates practice technical interviews with a backend-owned interview engine and configurable AI assistance.

## Stack
- **Frontend:** React, Vite, JavaScript, React Router, Tailwind CSS, Axios, Recharts
- **Backend:** Node.js, Express, REST APIs
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **Interview engine:** Configurable AI question generation and answer evaluation with validated fallbacks

## Project structure
```
├── backend/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── validators/
│   ├── utils/
│   └── data/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       ├── context/
│       ├── hooks/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
├── docs/
├── ROADMAP.md
└── README.md
```

## Prerequisites
- Node.js 18+
- MongoDB running locally (or update `MONGODB_URI`)

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed    # optional once MongoDB is up; uses ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev     # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # http://localhost:5173
```

Vite proxies `/api` to the backend during development.

## Adaptive difficulty (backend-owned)
- Easy = 1, Medium = 2, Hard = 3
- Uses the last 3 evaluated scores
- Average ≥ 80 → increase by 1
- Average < 50 → decrease by 1
- Otherwise keep the same
- Clamped to [1, 3]
- Poorly performing topics receive additional questions and topic-specific recovery
- Topic difficulty is isolated so weak DSA performance does not lower JavaScript difficulty
- Each question’s topic, difficulty, and score are stored in the interview progression

To create an administrator, set `ADMIN_EMAIL` and a strong, unique
`ADMIN_PASSWORD` in `backend/.env`, then run `npm run seed`. Do not commit or
reuse those credentials. Candidates should register through the UI.

## AI configuration
Question generation and answer evaluation are backend-only and configurable through `backend/.env`:

- `AI_PROVIDER=mock` — deterministic local provider for development
- `AI_PROVIDER=openai` — OpenAI-compatible Chat Completions provider
- `AI_API_KEY` — server-side key; never sent to the frontend
- `AI_MODEL`, `AI_BASE_URL`, `AI_TIMEOUT_MS`, `AI_MAX_RETRIES` — provider settings

AI output is validated before persistence. Provider errors or invalid responses
fall back to the built-in question bank or a safe heuristic evaluation so an
interview can continue. Candidate answers are persisted before evaluation, and
the final weighted score is always calculated by the backend.

## Production security recommendations

- Set `NODE_ENV=production`, use a long random `JWT_SECRET`, and set `CLIENT_URL`
  to the exact HTTPS frontend origin(s). Never use example values in production.
- Keep `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, and `AI_API_KEY` in a
  deployment secret manager or environment only. Do not place them in Vite
  `VITE_*` variables or ship them to browsers.
- Use TLS for the API, frontend, MongoDB connection, and AI provider. Restrict
  MongoDB network access and use a least-privilege database user.
- Rotate JWT, admin, and AI credentials periodically. Use separate admin
  accounts for operators and do not share seed credentials.
- Run `npm audit --prefix backend` and `npm audit --prefix frontend` in CI and
  review high/critical findings before deployment.
- Run behind a reverse proxy/WAF, preserve rate limiting, monitor authentication
  failures and database/AI errors, and never log passwords, bearer tokens,
  request bodies, or provider responses.
- JWTs are stored in browser storage by this MVP. For public production use,
  prefer short-lived access tokens with secure, HttpOnly, SameSite cookie-based
  refresh tokens and CSRF protection.

Phase 6 checks can be run with:

```bash
npm run test:phase6       # service-level success, failure, and validation checks
npm run test:phase6:api   # requires the backend running on port 5011
npm run test:adaptive      # deterministic threshold, boundary, and topic tests
npm run test:adaptive:api  # requires the backend running on port 5013
npm run test:phase8       # report aggregation and overall-feedback fallback checks
npm run test:phase8:api   # requires the backend running with MongoDB
```

Completed interviews expose a final report at `/interview/:id/result` with
skill/question analysis, difficulty progression, recommendations, and Recharts
visualizations. `/history` lists completed and in-progress sessions, while the
dashboard and `/analytics` aggregate completed interviews over time.

## Documentation
- [Architecture](docs/architecture.md)
- [API documentation](docs/api-documentation.md)
- [Database design](docs/database-design.md)
- [Software requirements specification](docs/srs.md)
- [Functional requirements](docs/functional-requirements.md)
- [Non-functional requirements](docs/non-functional-requirements.md)
- [Testing](docs/testing.md)
- [Mermaid diagrams](docs/diagrams.md)
- [Security](docs/security.md)
- [Risk analysis](docs/risk-analysis.md)
- [Future scope](docs/future-scope.md)
- [AI boundaries](docs/AI_BOUNDARIES.md)
- [Roadmap](ROADMAP.md)

## Out of MVP scope
Voice, video, AI avatar, eye tracking, advanced anti-cheating, real-time streaming.
