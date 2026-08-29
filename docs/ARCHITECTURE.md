# Architecture Overview

## System Style
Modular full-stack SPA + REST API:
- **Frontend**: React (Vite) SPA — UI, routing, charts, API client
- **Backend**: Node.js + Express — auth, business logic, adaptive engine, AI gateway
- **Database**: MongoDB via Mongoose
- **AI**: Called only from backend through an abstraction layer

```
┌─────────────────┐     REST/JSON      ┌──────────────────┐
│  React Frontend │ ◄────────────────► │  Express Backend │
│  Vite + Tailwind│    JWT Bearer      │  Controllers/Svc │
└─────────────────┘                    └────────┬─────────┘
                                                │
                         ┌──────────────────────┼──────────────────────┐
                         ▼                      ▼                      ▼
                   ┌──────────┐         ┌──────────────┐       ┌─────────────┐
                   │ MongoDB  │         │ AI Service   │       │ Fallback Q  │
                   │ Mongoose │         │ (LLM API)    │       │ Bank (JSON) │
                   └──────────┘         └──────────────┘       └─────────────┘
```

## Frontend Responsibilities
- Auth screens (register/login) and JWT storage
- Candidate dashboard and profile forms
- Interview setup (role, skills, difficulty start)
- Interview UI: show question, collect answer, show evaluation
- Final report + history + analytics charts (Recharts)
- Admin views (basic)
- **Never** holds AI API keys or adaptive decision logic

## Backend Responsibilities
- User auth (bcrypt + JWT)
- CRUD for users, interviews, questions, answers, skill performance
- Interview session orchestration
- Adaptive difficulty engine (authoritative)
- AI question generation & answer evaluation
- Fallback questions when AI fails
- Admin endpoints and role checks

## AI Integration Boundaries
| Allowed in AI service | Not allowed |
|-----------------------|-------------|
| Generate question text for role/skill/difficulty | Decide next difficulty |
| Score answer 0–100 + feedback text | Persist business entities directly |
| Suggest strengths/weaknesses for a turn | Receive frontend API keys |

Backend adaptive rules (authoritative):
- Easy=1, Medium=2, Hard=3
- Use last 3 evaluated scores
- avg ≥ 80 → +1 difficulty
- avg < 50 → −1 difficulty
- else keep same
- Clamp to [1, 3]

## Database Relationships (Logical)
```
User 1───* Interview
Interview 1───* Question
Question 1───1 Answer
User 1───* SkillPerformance
```

## Module Layout
```
backend/
  server.js       Entry point
  app.js          Express app (CORS, routes, errors)
  config/         DB + env
  models/         Mongoose schemas
  routes/         Express routers
  controllers/    Request handlers
  middleware/     Auth, roles, errors
  services/       AI, adaptive, interview orchestration
  validators/     Env / request validation helpers
  data/           Fallback question bank
  utils/          Helpers

frontend/src/
  layouts/        App shell / navigation
  pages/          Route-level screens
  components/     Reusable UI
  context/        Shared state (auth later)
  services/       Axios API client
  hooks/          Shared hooks
  utils/          Helpers
```
