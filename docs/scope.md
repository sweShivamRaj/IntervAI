# Scope

## In scope

### Candidate functionality

- Candidate registration and login with JWT authentication.
- Password hashing with bcryptjs.
- Candidate profile fields including name, education, experience, resume text,
  and skills.
- Interview setup for role, interview type, selected skills, starting
  difficulty, and question count.
- One-question-at-a-time text interview sessions.
- AI-generated questions through a backend-only provider integration.
- Built-in fallback questions when AI is unavailable or invalid.
- Answer submission, automated structured evaluation, and backend score
  calculation.
- Adaptive difficulty and topic selection based on recent evaluated results.
- Interview history, reports, recommendations, and candidate analytics.
- Candidate ownership checks for interviews, questions, answers, and reports.

### Administrator functionality

- Admin login through the common login screen.
- Backend role-based authorization for all `/api/admin/*` routes.
- Dashboard statistics: total users, total interviews, average score, popular
  skills, and recent interviews.
- User and interview read-only lists.
- Fallback question creation, editing, deletion, and skill/difficulty filters.

### Technical scope

- React/Vite frontend and Express REST backend.
- MongoDB persistence through Mongoose.
- Environment-based configuration for database, JWT, client origin, and AI.
- Request validation, protected routes, safe public errors, security headers,
  CORS allow-listing, and API rate limiting.

## Out of scope for the current MVP

- Voice interviews, video interviews, avatars, and real-time streaming.
- Automated hiring, candidate ranking for employment, or final recruitment
  decisions.
- A perfect or certified assessment of technical ability.
- Human interviewer review queues or recruiter collaboration workflows.
- Advanced anti-cheating, eye tracking, browser lockdown, or identity
  verification.
- Payments, subscriptions, multi-tenant organizations, and enterprise SSO.
- Fine-grained administrator permissions beyond the `admin` role.
- Full production observability, autoscaling, and disaster-recovery operations.
