# API Contracts (MVP)

Base URL: `http://localhost:5000/api`  
Auth: `Authorization: Bearer <jwt>` on protected routes.

## Auth
| Method | Path | Body / Notes | Response |
|--------|------|--------------|----------|
| POST | `/auth/register` | `{ name, email, password }` | `{ user, token }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, token }` |
| GET | `/auth/me` | JWT | `{ user }` |

## Profile
| Method | Path | Notes |
|--------|------|-------|
| GET | `/profile` | Current user profile |
| PUT | `/profile` | Update education, experience, skills, targetRoles |

## Interviews
| Method | Path | Body / Notes | Response |
|--------|------|--------------|----------|
| POST | `/interviews` | `{ jobRole, skills[], questionCount?, startingDifficulty? }` | interview |
| GET | `/interviews` | History for current user | `[interview]` |
| GET | `/interviews/:id` | Detail + questions/answers summary | interview |
| POST | `/interviews/:id/start` | Move to in_progress, select fallback Q1 | `{ interview, question, progress }` |
| GET | `/interviews/:id/questions` | Candidate-safe questions and current question | `{ interview, questions, currentQuestion, progress }` |
| POST | `/questions/:id/answer` | `{ interviewId?, userAnswer }` | `{ answer, evaluation, nextQuestion?, completed, report? }` |
| POST | `/interviews/:id/answer` | Legacy-compatible alias for answer submission | Same as `/questions/:id/answer` |
| GET | `/interviews/:id/report` | Final report (completed only) | report |
| GET | `/interviews/:id/result` | Alias for the final report route | report |

The completed report includes `overallScore`, `averageScore`, `questionCount`,
`skillAnalysis`, `questionAnalysis`, `difficultyProgression`, `strengths`,
`weaknesses`, `recommendedTopics`, and `overallFeedback`. It also includes the
ordered `questions` list used to show answer-level feedback. Difficulty
progression records have `{ order, topic, difficulty, difficultyLabel, score }`.

## Analytics
| Method | Path | Notes |
|--------|------|-------|
| GET | `/analytics/dashboard` | Dashboard stats, historical trend, skill performance, and recent interviews |
| GET | `/analytics/overview` | Compatibility summary with averages, counts, trend, and recent completed interviews |
| GET | `/analytics/skills` | Historical SkillPerformance aggregates |

## Admin (role=admin)
All `/admin/*` routes require JWT + `role=admin`. Missing token → 401. Candidate token → 403.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin/dashboard` | `{ stats: { totalUsers, totalInterviews, averageInterviewScore, mostPopularSkills }, recentInterviews }` |
| GET | `/admin/users` | `{ users }` with name, email, role, skills, createdAt |
| GET | `/admin/interviews` | `{ interviews }` with candidate, jobRole, score, status, date |
| GET | `/admin/questions` | Fallback bank. Query: `skill`/`topic`, `difficulty` (1–3 or easy/medium/hard) |
| POST | `/admin/questions` | Create fallback question |
| PUT | `/admin/questions/:id` | Update fallback question |
| DELETE | `/admin/questions/:id` | Delete fallback question |

## Meta
| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | `{ success: true, message: "AI Interview Platform API is running" }` |
| GET | `/ready` | DB readiness probe |
| GET | `/meta/roles-skills` | Catalog of job roles + skills for setup UI |

## Evaluation response shape (answer endpoint)
```json
{
  "evaluation": {
    "score": 72.5,
    "status": "completed",
    "correctness": 80,
    "relevance": 75,
    "technicalDepth": 70,
    "clarity": 68,
    "completeness": 72,
    "feedback": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "improvementSuggestion": "..."
  },
  "previousDifficulty": 2,
  "nextDifficulty": 2,
  "completed": false,
  "nextQuestion": {
    "_id": "...",
    "questionText": "...",
    "topic": "React",
    "difficulty": 2,
    "order": 2
  },
  "report": null
}
```

## Error shape
```json
{ "message": "Human-readable error", "code": "OPTIONAL_CODE" }
```
Status codes: 400 validation, 401 unauthorized, 403 forbidden, 404 not found, 500 server.
