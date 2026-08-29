# Future Scope

The following items are possible extensions and are not represented as current
MVP functionality.

## Product extensions

- Voice and video interview modes with explicit consent and privacy controls.
- Human reviewer or mentor feedback alongside automated feedback.
- Recruiter-created question sets and organization workspaces.
- More granular permissions such as content manager, reviewer, and platform
  operator.
- Interview templates, bookmarks, notes, and candidate-configurable practice
  plans.
- Multi-language question and feedback support with localized validation.

## Assessment improvements

- Calibrate evaluation prompts against a reviewed reference set.
- Compare automated scores with human ratings and report uncertainty rather than
  presenting a single score as definitive.
- Add rubric versioning so historical reports record the scoring configuration
  used at the time.
- Improve semantic duplicate detection and question diversity measurement.
- Add controlled coding-question execution in an isolated sandbox if it can be
  done safely.

## Engineering and operations

- Replace browser-storage JWT handling with short-lived access tokens and
  HttpOnly, SameSite refresh cookies plus CSRF protection.
- Add server-side session revocation, password reset, MFA, and account recovery.
- Add OpenAPI generation, contract tests, pagination, filtering, and search for
  larger admin lists.
- Add centralized structured logging, metrics, tracing, alerting, and audit
  logs for administrator actions.
- Add MongoDB backups, restore drills, migration tooling, and disaster recovery
  procedures.
- Add CI checks for tests, linting, dependency vulnerabilities, secret scans,
  accessibility, and build artifacts.
- Perform load, penetration, accessibility, and cross-browser testing before a
  public release.

## Responsible AI improvements

- Provide an explanation that automated feedback is advisory and can be wrong.
- Add user reporting for inappropriate or inaccurate questions.
- Review provider retention, data-processing, and privacy settings before
  sending candidate answers to an external provider.
- Add human oversight for any workflow that could influence a real hiring
  decision; the AI should not independently reject or select applicants.
