# Platform Test Cases

Test environment: local Node.js application, MongoDB on `127.0.0.1`, mock AI
provider unless a case says otherwise. Automated integration cases use unique
test records and clean up the records they create. Tested on 2026-08-29.

The `Actual Result` column records the latest automated/manual observation. The
cases can also be repeated manually using the running frontend at
`http://127.0.0.1:5173` and API at `http://127.0.0.1:5000`.

## Authentication

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| AUTH-001 | Valid registration | Unique name, email, and password of at least 6 characters | HTTP 201; candidate account and token returned; password absent from response | HTTP 201; role was `candidate`; password was not returned | Passed |
| AUTH-002 | Duplicate email | Register again with an existing email | HTTP 400 with a safe duplicate-email message | HTTP 400 | Passed |
| AUTH-003 | Invalid email | `not-an-email` | HTTP 400 validation response | HTTP 400 | Passed |
| AUTH-004 | Missing or weak password | Omit password or submit `123` | HTTP 400 validation response | HTTP 400 for both cases | Passed |
| AUTH-005 | Valid login | Registered email and correct password | HTTP 200 with token and sanitized user | HTTP 200 with token and role | Passed |
| AUTH-006 | Invalid login | Correct email and incorrect password | HTTP 401 with generic authentication error | HTTP 401 | Passed |
| AUTH-007 | Logout | Authenticated `POST /api/auth/logout` | HTTP 200; client session can be cleared | HTTP 200 | Passed |
| AUTH-008 | Expired JWT | Expired signed token on `/api/auth/me` | HTTP 401 with `TOKEN_EXPIRED` | HTTP 401 with `TOKEN_EXPIRED` | Passed |
| AUTH-009 | Invalid/protected route | No token or malformed token on `/api/auth/me` | HTTP 401; no stack trace | HTTP 401 with safe message and no stack trace | Passed |

## Interview flow

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| INT-001 | Create interview | Valid role, skill, and question count 3–15 | HTTP 201; interview belongs to authenticated user | HTTP 201; persisted user ownership matched | Passed |
| INT-002 | Start interview | Authenticated owner starts a created interview | HTTP 200; current question returned | HTTP 200; current question returned | Passed |
| INT-003 | Question generation | Mock AI with selected skill and difficulty | Valid question with requested topic/difficulty; private expected concepts not exposed | Valid generated question returned; expected concepts were not exposed | Passed |
| INT-004 | Empty answer | Whitespace-only answer | HTTP 400; no answer stored | HTTP 400 | Passed |
| INT-005 | Answer submission | Current question and non-empty answer | HTTP 200; answer and evaluation stored | HTTP 200; answer received a validated evaluation | Passed |
| INT-006 | Duplicate submission | Submit the same question twice | HTTP 400; only one answer remains | HTTP 400; duplicate rejected | Passed |
| INT-007 | Interview completion | Submit all 3 answers in order | Final response indicates `completed: true` and includes report | Completed successfully with report | Passed |
| INT-008 | Result retrieval | Owner requests `/report` after completion | HTTP 200; report contains all questions and stored answers | HTTP 200; 3-question report returned | Passed |
| INT-009 | Invalid interview/question IDs | Malformed ObjectId in protected endpoints | Safe HTTP 404/400 response | HTTP 404/400; no internal details exposed | Passed |

## AI and fallback behavior

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| AI-001 | Valid AI question | Mock provider | Validated question object returned | Valid question returned | Passed |
| AI-002 | Invalid AI response | Provider returns wrong JSON shape | Response rejected and fallback question returned | Fallback question returned | Passed |
| AI-003 | AI timeout | Provider request aborts at configured timeout | Safe fallback question/evaluation; interview continues | Safe fallback returned | Passed |
| AI-004 | AI unavailable | Provider throws/network failure | Safe fallback; technical reason remains server-side | Safe fallback returned | Passed |
| AI-005 | Invalid evaluation response | Provider returns invalid score/schema | Invalid response rejected; retry policy applied; safe fallback evaluation returned | Invalid response retried and fallback returned | Passed |
| AI-006 | No configured provider key | `AI_PROVIDER=openai`, empty `AI_API_KEY` | Built-in question/evaluation fallback | Answer saved and interview continued with fallback | Passed |

## Adaptive engine

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ADP-001 | Strong score increase | Current Medium, score 90 | Next difficulty Hard | Hard (`3`) | Passed |
| ADP-002 | Strong score increase | Current Medium, score 85 | Next difficulty Hard | Hard (`3`) | Passed |
| ADP-003 | Neutral score unchanged | Current Medium, score 70 | Next difficulty Medium | Medium (`2`) | Passed |
| ADP-004 | Weak score decrease | Current Medium, score 45 | Next difficulty Easy | Easy (`1`) | Passed |
| ADP-005 | Weak score decrease | Current Medium, score 20 | Next difficulty Easy | Easy (`1`) | Passed |
| ADP-006 | Easy lower boundary | Current Easy, low score | Difficulty cannot go below Easy | Remained Easy (`1`) | Passed |
| ADP-007 | Hard upper boundary | Current Hard, high score | Difficulty cannot go above Hard | Remained Hard (`3`) | Passed |
| ADP-008 | API progression | Scores generated by a strong, strong, weak, strong sequence | Difficulty progression follows backend rules and recovery | Easy → Medium → Hard → Medium | Passed |

## Database persistence

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| DB-001 | User creation | Valid registration | User document created with bcrypt hash | User document created; password began with bcrypt hash prefix | Passed |
| DB-002 | Interview creation | Valid authenticated interview request | Interview document stores owner, role, skills, and count | Persisted interview matched request and owner | Passed |
| DB-003 | Question storage | Start an interview | Question document stores interview reference, order, topic, and difficulty | 3 questions persisted for completed test interview | Passed |
| DB-004 | Answer storage | Submit answer | Answer document stores interview/question references and evaluation | 3 answers persisted with evaluations | Passed |
| DB-005 | Result retrieval | Request owner report | Stored records aggregate into report | Report returned all persisted questions and answers | Passed |

## Authorization

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| AUTHZ-001 | Candidate ownership | Candidate B requests Candidate A interview, questions, or report | HTTP 404; Candidate B cannot discover/access the record | HTTP 404 for cross-owner interview and questions | Passed |
| AUTHZ-002 | Admin access | Admin JWT requests admin dashboard, users, interviews, and questions | HTTP 200 for permitted reads | All admin reads returned HTTP 200 | Passed |
| AUTHZ-003 | Candidate admin denial | Candidate JWT requests all admin reads and question CRUD | HTTP 403 for every admin endpoint | All tested admin endpoints returned HTTP 403 | Passed |
| AUTHZ-004 | Unauthenticated admin denial | No JWT requests admin endpoint | HTTP 401 | HTTP 401 | Passed |

## Frontend and operational checks

| Test Case ID | Description | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| UI-001 | Login role selection | Choose Candidate or Admin on login form | Selected role is checked after authentication; mismatch is cleared safely | Role selector rendered and mismatch handling implemented | Passed |
| UI-002 | Admin route protection | Open `/admin` while signed out or as candidate | Redirect to login/dashboard; no admin data shown | Route guard behavior verified in source and API tests | Passed |
| UI-003 | Production frontend build | `npm run build` in `frontend` | Build completes successfully | Vite build completed successfully | Passed |
| OPS-001 | Backend test command | `npm test` in `backend` | All configured unit and comprehensive tests pass | Passed after adding the repeatable test command | Passed |
| OPS-002 | Lint availability | Inspect package scripts | Run lint if configured | No lint script is configured in this project | Not configured |

## Automated commands

```bash
cd backend
npm test
npm run test:admin                 # requires temporary ADMIN_EMAIL/ADMIN_PASSWORD values
node tests/phase6FallbackIntegration.test.js  # requires server in fallback mode
```

```bash
cd frontend
npm run build
```

The API integration cases require MongoDB. The fallback integration case uses a
separate server started with `AI_PROVIDER=openai` and no `AI_API_KEY` so the
backend fallback path is exercised without contacting an external provider.
