# Development Roadmap — AI-Powered Adaptive Interview Platform

## Phase 0 — Project Foundation ✅
- [x] Inspect workspace and define architecture
- [x] Create monorepo structure (`backend/`, `frontend/`, `docs/`)
- [x] Document API contracts, data models, AI boundaries
- [x] Scaffold Express + MongoDB backend
- [x] Scaffold Vite + React + Tailwind frontend
- [x] Install core dependencies
- [x] Environment templates and README

## Phase 1 — Full-stack project setup ✅
- [x] React + Vite frontend configured
- [x] Node.js + Express backend configured
- [x] MongoDB/Mongoose connection
- [x] Environment variables (`.env.example`)
- [x] CORS + basic error handling
- [x] Axios API service + health client
- [x] Clean folder structure (`layouts/`, `validators/`, flattened backend)
- [x] `GET /api/health` with required response shape
- [x] Frontend shell routes and authentication UI
- [x] Frontend build + backend health verified

## Phase 2 — Interview Setup & Session Lifecycle
- [x] Job role + skill selection APIs
- [x] Create interview session
- [x] Start / complete interview status flow
- [x] Frontend: Dashboard, Interview Setup, Session shell
- [ ] End-to-end QA with live MongoDB

## Phase 3 — AI Questions, Answers & Evaluation
- [x] AI service abstraction (`generateQuestion`, `evaluateAnswer`)
- [x] Fallback question bank when AI unavailable
- [x] Answer submission + evaluation persistence
- [x] Frontend: Question view, answer form, feedback display
- [ ] Optional: wire real OpenAI key and compare vs mock

## Phase 4 — Basic Interview Engine
- [x] Fallback question bank for all supported interview topics
- [x] Question and answer persistence
- [x] Start, retrieve, answer, progress, and completion APIs
- [x] Candidate interview screen with validation and completion redirect
- [x] Adaptive difficulty without AI integration
- [x] Final result report and SkillPerformance aggregates

## Phase 5 — AI Question Generation & Admin
- [x] Configurable backend AI question provider
- [x] Structured question output validation with retries and fallback
- [x] Role, skill, difficulty, and duplicate-aware generation context
- [x] Keep AI credentials server-side and AI outside database operations
- [x] Basic admin: users list, interviews overview
- [x] Role-based access (candidate vs admin)
- [ ] Demo walkthrough polish

## Phase 6 — AI-Powered Candidate Answer Evaluation
- [x] Dedicated answer evaluation service with configurable provider
- [x] Validate AI evaluation dimensions and retry invalid responses
- [x] Calculate weighted final score on the backend
- [x] Persist answer before evaluation and preserve answers on provider failure
- [x] Candidate-facing score, feedback, strengths, and improvement suggestion
- [x] Mock success, weak/strong, empty, provider failure, and invalid response tests

## Phase 7 — Adaptive Interview Difficulty Engine
- [x] Deterministic global recent-score difficulty rules
- [x] Easy/Hard boundary enforcement
- [x] Topic-aware performance tracking and topic selection
- [x] Per-topic difficulty isolation so weak skills do not reduce strong skills
- [x] Persist difficulty progression on interviews and final reports
- [x] Unit tests for thresholds, boundaries, multiple scores, and topic isolation
- [x] End-to-end Easy → Medium → Hard → Medium progression test

## Phase 8 — Final Reports, History & Analytics
- [x] Completed interview report aggregates and AI-generated overall feedback
- [x] Responsive Recharts report visualizations
- [x] Interview history with completed-report and in-progress-session links
- [x] Dashboard and analytics statistics, trends, and skill performance
- [x] Historical SkillPerformance aggregation with attempts, averages, best scores, and timestamps
- [x] Empty, loading, and error states for report, history, dashboard, and analytics
- [x] Completed, incomplete, empty-history, multiple-interview, and skill-statistics tests

## Phase 9 — Polish & Demo Readiness
- [ ] Broader validation / loading UX polish
- [ ] Sample candidate demo account in seed
- [ ] SE documentation alignment (SRS, use cases if required)

---

### Explicitly Out of Scope (MVP)
Voice, video, AI avatar, eye tracking, advanced anti-cheating, real-time streaming.
