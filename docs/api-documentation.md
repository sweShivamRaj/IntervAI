# API Documentation

## 1. Conventions

- Development base URL: `http://localhost:5000/api`.
- Production base URL is deployment-specific and should use HTTPS.
- JSON is used for request and response bodies.
- Protected routes require `Authorization: Bearer <jwt>`.
- IDs are MongoDB ObjectIds.
- Public errors contain a safe `message` and may contain a stable `code`; stack
  traces and internal provider/database details are not returned.

## 2. Status codes

| Status | Meaning |
|---|---|
| 200 | Successful read or update |
| 201 | Resource created |
| 400 | Invalid request, state transition, or duplicate operation |
| 401 | Missing, invalid, or expired JWT |
| 403 | Insufficient role or disallowed browser origin |
| 404 | Resource or valid-looking ID was not found |
| 503 | Database or authentication configuration unavailable |
| 500 | Unexpected failure returned as a generic public error |

## 3. Public and health endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/health` | None | Process health message |
| GET | `/ready` | None | Database readiness; 200 when connected, 503 otherwise |
| GET | `/meta/roles-skills` | None | Role and skill catalog for setup UI |

## 4. Authentication

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | 201 with sanitized user and token |
| POST | `/auth/login` | `{ email, password }` | 200 with sanitized user and token |
| POST | `/auth/logout` | JWT | 200 acknowledgement; client clears the token |
| GET | `/auth/me` | JWT | 200 with current sanitized user |

Registration always creates the `candidate` role. Administrators should be
provisioned through the controlled seed/configuration process rather than public
registration.

## 5. Profile

All profile endpoints require a JWT.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/profile` | None | Current sanitized profile |
| PUT | `/profile` | `name`, `education`, `experience`, `resume`, or `skills` | Updated sanitized profile |

Profile updates reject empty or oversized values and do not accept role or
user-ID updates.

## 6. Interview endpoints

All interview endpoints require a JWT. Candidate requests enforce ownership.
The detail endpoint also supports an authenticated admin's operational review;
other session actions remain candidate-owned.

### Create interview

`POST /interviews`

```json
{
  "jobRole": "Backend Developer",
  "skills": ["Node.js", "MongoDB"],
  "interviewType": "technical",
  "initialDifficulty": "adaptive",
  "questionCount": 5
}
```

`interviewType` is `technical`, `behavioral`, or `mixed`. `initialDifficulty`
is `adaptive`, `easy`, `medium`, or `hard`. `questionCount` is an integer from
3 through 15.

### Session and questions

| Method | Path | Purpose |
|---|---|---|
| GET | `/interviews` | List only the current user's interviews |
| GET | `/interviews/:id` | Get owned interview detail and candidate-safe data |
| POST | `/interviews/:id/start` | Start or resume an owned interview |
| GET | `/interviews/:id/questions` | Get owned questions and current question |
| POST | `/interviews/:id/answer` | Legacy-compatible answer route |
| GET | `/interviews/:id/report` | Get completed owned report |
| GET | `/interviews/:id/result` | Alias for report |

### Submit answer

`POST /questions/:questionId/answer`

```json
{
  "interviewId": "<interview-object-id>",
  "userAnswer": "The event loop coordinates asynchronous work..."
}
```

The question must belong to an interview owned by the current user and must be
the current unanswered question. The answer is stored before external AI
evaluation. The response includes the answer, evaluation, previous and next
difficulty, and either a next question or a completed report.

Candidate question responses omit `expectedConcepts`. Client-supplied scores
are ignored; the final weighted score is calculated on the backend.

## 7. Candidate analytics

| Method | Path | Purpose |
|---|---|---|
| GET | `/analytics/dashboard` | Completed-interview stats, trends, skills, and recent items |
| GET | `/analytics/overview` | Compatibility summary of candidate analytics |
| GET | `/analytics/skills` | Candidate skill-performance aggregates |

Analytics are calculated from the authenticated candidate's data.

## 8. Admin API

Every `/admin/*` route requires both a valid JWT and `role=admin`. Missing or
invalid tokens return 401; a candidate token returns 403.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | Total users, interviews, average score, popular skills, recent interviews |
| GET | `/admin/users` | User name, email, role, skills, and created date |
| GET | `/admin/interviews` | Candidate, job role, score, status, and date |
| GET | `/admin/questions` | Fallback questions; query `skill`/`topic` and `difficulty` |
| POST | `/admin/questions` | Create a fallback question |
| PUT | `/admin/questions/:id` | Update fallback question fields |
| DELETE | `/admin/questions/:id` | Delete a fallback question |

Fallback question creation requires question text, topic, difficulty, question
type, and at least one expected concept. Text is 20–600 characters; concepts
are limited and are used only by backend evaluation.

## 9. AI provider interface

The browser never calls the AI provider. The backend uses `AI_PROVIDER`,
`AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `AI_TIMEOUT_MS`, and `AI_MAX_RETRIES`.
An OpenAI-compatible provider returns structured question/evaluation content.
Invalid content, timeouts, and network failures use server-side fallbacks.

## 10. Example errors

```json
{ "success": false, "message": "Not authorized. Invalid token.", "code": "TOKEN_INVALID" }
```

```json
{ "success": false, "message": "Invalid request data.", "code": "VALIDATION_ERROR" }
```

Errors intentionally avoid exposing stack traces, MongoDB query details, AI
provider responses, or secrets.
