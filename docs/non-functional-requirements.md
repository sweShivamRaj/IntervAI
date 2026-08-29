# Non-Functional Requirements

These requirements define quality expectations for the current academic MVP.
They are targets and constraints, not claims of production-scale capacity.

## Security

| ID | Requirement |
|---|---|
| NFR-SEC-001 | Passwords shall be stored as bcrypt hashes and never returned in API responses. |
| NFR-SEC-002 | AI, JWT, database, and administrator secrets shall be configured server-side and excluded from the frontend bundle. |
| NFR-SEC-003 | Protected API requests shall require valid authentication; admin APIs shall additionally require the admin role. |
| NFR-SEC-004 | Candidate-owned resources shall be checked against the authenticated user before access. |
| NFR-SEC-005 | Public errors shall not include stack traces, provider keys, database credentials, or internal implementation details. |
| NFR-SEC-006 | The API shall apply security headers, a CORS allow-list, body-size limits, and rate limiting. |

## Reliability and recoverability

| ID | Requirement |
|---|---|
| NFR-REL-001 | AI provider timeout, invalid response, and network failure shall fall back without losing a previously submitted answer. |
| NFR-REL-002 | Database-unavailable data routes shall return a controlled service-unavailable response. |
| NFR-REL-003 | Concurrent question creation shall not create duplicate question orders when the database unique index is available. |
| NFR-REL-004 | A completed interview report shall remain available even if overall AI feedback generation fails. |

## Performance and capacity

| ID | Requirement |
|---|---|
| NFR-PERF-001 | Request bodies shall be limited to 1 MB at the API boundary. |
| NFR-PERF-002 | AI calls shall use a configured timeout and bounded retry count. |
| NFR-PERF-003 | Admin interview listings shall be bounded to the current MVP display limit. |
| NFR-PERF-004 | The project shall not claim a specific concurrent-user capacity until load testing is performed. |

## Maintainability

| ID | Requirement |
|---|---|
| NFR-MNT-001 | Frontend, controllers, services, middleware, validators, and models should remain separated by responsibility. |
| NFR-MNT-002 | Adaptive rules and AI response contracts should be testable without requiring a live AI provider. |
| NFR-MNT-003 | Configuration should be supplied through documented environment variables. |
| NFR-MNT-004 | Automated tests and manual test cases should be maintained with the project. |

## Usability and accessibility

| ID | Requirement |
|---|---|
| NFR-USE-001 | Candidate and admin workflows shall provide readable validation and failure messages. |
| NFR-USE-002 | The UI shall show session progress and distinguish completed, fallback, and error states where applicable. |
| NFR-USE-003 | Interactive controls should have labels, keyboard-accessible semantics, and status announcements where practical. |
| NFR-USE-004 | The current MVP shall be treated as a responsive browser application; broad device/browser certification is not claimed. |

## Compatibility and deployment

| ID | Requirement |
|---|---|
| NFR-COMP-001 | The backend shall run on Node.js 18 or a later supported version. |
| NFR-COMP-002 | The frontend shall be buildable as a Vite production bundle. |
| NFR-COMP-003 | The API shall support a configured frontend origin rather than allowing arbitrary browser origins. |
| NFR-COMP-004 | Deployment-specific TLS, secret management, backups, and monitoring shall be supplied by the production environment. |
