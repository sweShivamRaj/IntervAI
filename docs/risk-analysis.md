# Risk Analysis

Probability and impact are qualitative assessments for the current MVP. They
are not statistical forecasts. Risks should be reviewed again before a public
deployment.

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| AI API failure | Medium | High: question generation or evaluation may fail during a session | Keep a validated fallback question bank and heuristic evaluation; bound timeouts and retries; persist answers before evaluation; monitor provider errors. |
| AI hallucination | Medium | Medium/High: a question or feedback item may be inaccurate or unsuitable | Use structured output, validate topic/difficulty/type/content, reject duplicates and inappropriate content, keep backend rules authoritative, and communicate that AI feedback is advisory. |
| Evaluation inconsistency | Medium | Medium: similar answers may receive different or imperfect scores | Use a constrained schema and backend weighting; use deterministic mock/fallback behavior for development; expose feedback as practice guidance rather than a hiring decision; consider calibration and human review later. |
| Repeated questions | Medium | Medium: practice quality and user trust may decline | Track prior question text, validate near-duplicates, use ordered interview questions, and maintain fallback-bank coverage. |
| API cost | Medium | Medium: live provider use may exceed a student budget | Default local development to mock/fallback providers, configure model and retry limits, cap input/output sizes, monitor usage, and add quotas before production. |
| Database failure | Low/Medium | High: new sessions or reports may be unavailable | Use readiness checks, controlled 503 responses, indexes and validation, backups, restore testing, and a managed MongoDB deployment with monitoring. |
| Security risks | Medium | High: credential, token, or private interview data exposure | Hash passwords, keep secrets server-side, use JWT/RBAC/ownership checks, Helmet, strict CORS, rate limiting, validation, safe errors, TLS, secret rotation, and security testing. |
| Network failure | Medium | Medium/High: browser, database, or AI requests may time out | Configure timeouts, handle retries where bounded, preserve submitted answers before AI calls, show retryable UI errors, and keep local fallback behavior. |
| Scope creep | High | Medium: extra features may delay or destabilize the core MVP | Maintain the documented scope, prioritize candidate flow and security, use change review, separate future work, and avoid adding voice/video/enterprise features without capacity. |

## Risk response priority

The highest immediate priorities are protecting credentials and ownership,
keeping the interview usable during AI/network failure, and preserving database
recoverability. Before a real public launch, the team should add operational
monitoring, production token handling, load testing, and a security review.
