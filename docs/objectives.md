# Objectives

## Primary objectives

1. Build a usable web platform for structured interview practice.
2. Personalize interview sessions using the candidate's target role and
   selected skills.
3. Generate one question at a time and adapt later questions to recent
   performance.
4. Provide immediate, structured feedback for each submitted answer.
5. Store interview progress, scores, and skill performance for later review.
6. Produce a final report with score summaries, strengths, weaknesses, and
   recommended focus areas.
7. Keep adaptive decisions, validation, persistence, and final scoring under
   backend control.
8. Provide administrators with basic platform monitoring and fallback question
   bank management.

## Engineering objectives

- Separate frontend presentation, API controllers, business services, and data
  models.
- Validate external AI output before it is stored or shown to a candidate.
- Continue an interview when the AI provider fails through deterministic local
  fallbacks.
- Apply authentication, role authorization, ownership checks, safe error
  responses, rate limiting, and environment-based secret configuration.
- Keep the system understandable, testable, and appropriate for a university
  Software Engineering project.

## Success indicators

The MVP is considered successful when a candidate can register, configure and
complete a text interview, retrieve a report, and see difficulty respond to
scores; an administrator can access protected administration features; and the
system remains usable during simulated AI-provider failures.
