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
npm run seed    # optional once MongoDB is up: creates admin@interview.local / Admin@123
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

## Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@interview.local | Admin@123 |
| Candidate | register via UI | — |

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
- [Architecture](docs/ARCHITECTURE.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Data models](docs/DATA_MODELS.md)
- [AI boundaries](docs/AI_BOUNDARIES.md)
- [Roadmap](ROADMAP.md)

## Out of MVP scope
Voice, video, AI avatar, eye tracking, advanced anti-cheating, real-time streaming.
