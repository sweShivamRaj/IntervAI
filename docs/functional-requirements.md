# Functional Requirements

The requirements below describe the current MVP behavior. `FR` identifiers are
used for traceability in the SRS and test plan.

## Authentication and accounts

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | The system shall allow a new candidate to register with a name, email, and password. | Must |
| FR-002 | The system shall reject invalid email formats, missing fields, and passwords outside the supported length range. | Must |
| FR-003 | The system shall prevent duplicate email registration. | Must |
| FR-004 | The system shall authenticate users with a JWT bearer token after valid credentials. | Must |
| FR-005 | The system shall distinguish `candidate` and `admin` roles. | Must |
| FR-006 | The system shall allow a client to clear a local session through logout. | Should |
| FR-007 | The system shall return sanitized user data without the password hash. | Must |

## Candidate profile

| ID | Requirement | Priority |
|---|---|---|
| FR-008 | An authenticated candidate shall be able to read their own profile. | Must |
| FR-009 | An authenticated candidate shall be able to update allowed profile fields: name, education, experience, resume text, and skills. | Must |
| FR-010 | Profile updates shall be validated and shall not permit role or account-ownership changes. | Must |

## Interview setup and session

| ID | Requirement | Priority |
|---|---|---|
| FR-011 | An authenticated candidate shall be able to create an interview for a job role and one or more skills. | Must |
| FR-012 | The candidate shall be able to choose technical, behavioral, or mixed interview type. | Must |
| FR-013 | The candidate shall be able to choose adaptive, easy, medium, or hard starting difficulty. | Must |
| FR-014 | The system shall constrain the interview question count to the supported range of 3–15. | Must |
| FR-015 | The system shall start an interview and return one current question at a time. | Must |
| FR-016 | The system shall store the interview owner and use it for subsequent authorization checks. | Must |
| FR-017 | The system shall allow a candidate to resume an in-progress interview. | Should |

## AI, evaluation, and adaptation

| ID | Requirement | Priority |
|---|---|---|
| FR-018 | The backend shall provide role, topic, difficulty, previous-question, and performance context to the configured question provider. | Must |
| FR-019 | The backend shall validate question topic, difficulty, type, length, concepts, appropriateness, and duplicate safety before persistence. | Must |
| FR-020 | The system shall use a built-in fallback question when AI is unavailable or invalid. | Must |
| FR-021 | The system shall persist a candidate answer before attempting external evaluation. | Must |
| FR-022 | The backend shall validate evaluation dimensions, feedback, and recommendation fields. | Must |
| FR-023 | The backend shall calculate the final weighted score and ignore client-supplied score values. | Must |
| FR-024 | The adaptive engine shall increase difficulty when the relevant recent average is at least 80, decrease it below 50, and otherwise retain it. | Must |
| FR-025 | The adaptive engine shall clamp difficulty between Easy and Hard. | Must |
| FR-026 | The system shall use a safe heuristic evaluation when an evaluation provider fails. | Must |

## Reports and analytics

| ID | Requirement | Priority |
|---|---|---|
| FR-027 | The system shall mark an interview complete after the configured number of answers. | Must |
| FR-028 | The system shall provide a completed report with overall score, question analysis, skill analysis, difficulty progression, strengths, weaknesses, and recommendations. | Must |
| FR-029 | A candidate shall be able to list and view only their own interviews and reports. | Must |
| FR-030 | The system shall provide candidate analytics based on completed interviews. | Should |

## Administration

| ID | Requirement | Priority |
|---|---|---|
| FR-031 | Admin APIs shall require a valid JWT and `admin` role. | Must |
| FR-032 | The admin dashboard shall show total users, total interviews, average interview score, popular skills, and recent interviews. | Must |
| FR-033 | An administrator shall be able to view user name, email, role, skills, and creation date. | Must |
| FR-034 | An administrator shall be able to view candidate, job role, score, status, and date for interviews. | Must |
| FR-035 | An administrator shall be able to create, edit, delete, and filter fallback questions by skill and difficulty. | Must |
| FR-036 | Candidate and unauthenticated requests shall not receive admin data or perform admin operations. | Must |
