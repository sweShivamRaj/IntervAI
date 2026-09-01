# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This SRS specifies the requirements and operating boundaries of the
IntervAI platform. It is intended for students,
supervisors, developers, testers, and evaluators of the university project.

### 1.2 Product perspective

The product is a browser-based single-page application backed by an Express REST
API and MongoDB. AI providers are external dependencies accessed only by the
backend. A built-in fallback bank and heuristic evaluation make the main
practice flow demonstrable without a live AI account.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Candidate | A user with the `candidate` role who practices interviews. |
| Admin | A user with the `admin` role who manages platform information and fallback questions. |
| Interview | A persisted practice session belonging to one user. |
| Question | An ordered prompt associated with an interview. |
| Evaluation | Structured feedback and dimension scores for one answer. |
| Fallback | A local question or heuristic evaluation used when an AI provider is not usable. |
| Adaptive difficulty | Backend selection of Easy, Medium, or Hard from stored performance. |

## 2. Overall description

### 2.1 Product functions

The product supports account management, profile management, interview setup,
question generation, answer evaluation, adaptive sequencing, reports,
analytics, and admin management. See
[functional requirements](functional-requirements.md) for traceable `FR` items.

### 2.2 User characteristics

- Candidates need only a browser and enough information to configure a text
  practice session.
- Administrators need an account provisioned through the backend seed process or
  another controlled process. Public registration always creates a candidate.
- Developers and testers need Node.js, MongoDB, and the documented environment
  configuration.

### 2.3 Assumptions and dependencies

- MongoDB is reachable for persistent workflows.
- JWT and database secrets are supplied through environment configuration.
- The AI provider may be absent, slow, unavailable, or return invalid content.
- A browser has JavaScript and local storage enabled for the current MVP token
  session behavior.
- Automated AI feedback is advisory practice feedback, not a hiring decision or
  a perfect replacement for human judgment.

### 2.4 Constraints

- The current application is text-based.
- The backend owns adaptive decisions, final score calculation, resource
  ownership, and AI-output validation.
- The supported question count is 3–15.
- The current role model has only `candidate` and `admin`.

## 3. Use cases

| ID | Actor | Use case | Result |
|---|---|---|---|
| UC-01 | Candidate | Register | Candidate account and signed session are created. |
| UC-02 | Candidate | Sign in | Valid credentials produce a JWT; invalid credentials are rejected. |
| UC-03 | Candidate | Update profile | Allowed profile information is validated and stored. |
| UC-04 | Candidate | Configure interview | Role, skills, format, starting difficulty, and count are stored. |
| UC-05 | Candidate | Complete interview | Questions and answers are stored, evaluated, adapted, and completed. |
| UC-06 | Candidate | Review report | The candidate sees their own completed report and analytics. |
| UC-07 | Admin | Review dashboard | Authorized admin sees aggregate platform statistics and recent interviews. |
| UC-08 | Admin | Manage fallback bank | Authorized admin creates, edits, deletes, and filters fallback questions. |

## 4. Core use-case flow

1. Candidate signs in and loads their profile.
2. Candidate selects a job role, interview type, skills, starting difficulty,
   and question count.
3. Backend stores the interview and selects the first topic and difficulty.
4. AI service generates a structured question, or the fallback bank supplies
   one.
5. Candidate submits an answer.
6. Backend stores the answer, evaluates it, calculates a weighted score, and
   updates topic performance.
7. Adaptive service selects the next topic and difficulty.
8. The flow repeats until the configured count is reached.
9. Backend stores the final report; candidate retrieves it through an ownership-
   checked route.

## 5. External interfaces

- **User interface:** React SPA served by Vite during development and as a
  production bundle after build.
- **REST interface:** JSON requests under `/api`; protected routes use
  `Authorization: Bearer <jwt>`.
- **Database interface:** Mongoose models and MongoDB collections.
- **AI interface:** Backend HTTP call to an OpenAI-compatible `/chat/completions`
  endpoint when configured.
- **Health interface:** `/api/health` reports process availability and
  `/api/ready` reports database readiness.

## 6. Data and security requirements

Passwords are hashed before persistence. API responses use sanitized users.
Candidate requests are checked for ownership, and admin APIs require the admin
role. Expected concepts and provider credentials stay backend-side. Public
errors are intentionally less detailed than server logs.

## 7. Acceptance criteria

The MVP meets its acceptance criteria when:

- a candidate can register, log in, create, complete, and retrieve an interview;
- answer submission, duplicate submission, empty answers, and invalid IDs are
  handled predictably;
- mock or fallback AI can complete the flow without a live key;
- adaptive scores and Easy/Hard boundaries behave according to the documented
  rules;
- Candidate A cannot retrieve Candidate B's interview;
- an admin can read dashboard data and manage fallback questions while a
  candidate receives `403` from admin APIs; and
- the frontend builds and automated tests pass.

## 8. Traceability

- Requirements: [functional requirements](functional-requirements.md),
  [non-functional requirements](non-functional-requirements.md)
- Architecture and diagrams: [architecture](architecture.md),
  [diagrams](diagrams.md)
- Data: [database design](database-design.md)
- API: [API documentation](api-documentation.md)
- Verification: [testing](testing.md)
- Security: [security](security.md)
- Risks: [risk analysis](risk-analysis.md)
