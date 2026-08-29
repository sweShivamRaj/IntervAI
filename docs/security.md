# Security Design and Controls

## Security objectives

The MVP protects account credentials, limits access to user-owned interview
data, keeps AI credentials on the server, and returns controlled public errors.
It is designed as a university project and does not claim to provide complete
enterprise security without deployment-level controls.

## Authentication

- Registration and login are provided by the backend.
- Passwords are hashed with bcryptjs before persistence; plaintext passwords are
  not stored or returned.
- JWTs are signed with `JWT_SECRET` and carry the user identifier.
- Missing, malformed, invalid, and expired tokens are rejected with 401.
- The backend reloads the user for each protected request, so a missing user
  cannot use an old token.
- The frontend clears its local session after a 401 response.

The current MVP stores the JWT in browser storage. This is convenient for the
student project but increases exposure if an XSS vulnerability exists. A public
deployment should use short-lived access tokens and secure HttpOnly,
SameSite refresh cookies with an appropriate CSRF design.

## Authorization and ownership

- Candidate registration always creates the `candidate` role.
- All admin routes use `protect` followed by `authorize('admin')`.
- Frontend `AdminRoute` improves user experience but is not the security
  boundary; backend middleware is authoritative.
- Interview reads, starts, questions, answers, and reports verify that the
  interview belongs to the authenticated user.
- Candidate A cannot access Candidate B's interviews through an ID or list
  endpoint.
- Admin services can view the aggregate data specifically required for admin
  operation.

## Input and API controls

- Request bodies for authentication, profiles, interviews, answers, and admin
  questions are validated before use.
- MongoDB ObjectId route parameters are validated.
- Interview counts, skill lists, answer lengths, question text, and evaluation
  fields have explicit bounds.
- Mongoose schemas provide a second validation layer and strict query behavior.
- Express JSON parsing is limited to 1 MB.
- API rate limiting applies to general API traffic and more tightly to login and
  registration routes.
- CORS uses configured origin allow-listing and credentials support; arbitrary
  browser origins are not allowed.
- Helmet supplies security headers and production CSP handling.

## Secret and data protection

- `MONGODB_URI`, `JWT_SECRET`, `AI_API_KEY`, and admin credentials are read from
  environment configuration.
- Secrets are absent from frontend `VITE_*` configuration and are not sent to
  browsers.
- AI calls are made only from backend services.
- `expectedConcepts` are private evaluator data and are omitted from candidate
  question responses.
- User serialization excludes the password field.
- Logging should not include passwords, bearer tokens, request bodies, or AI
  provider responses.

## Error handling

The public error handler maps validation, duplicate, identifier, authentication,
authorization, dependency, and unexpected errors to safe JSON. Stack traces and
technical provider/database messages are logged only on the server where
logging access is controlled. A provider failure produces a safe fallback rather
than returning the provider error to a candidate.

## Operational recommendations

For deployment, use HTTPS, a secrets manager, restricted MongoDB network access,
least-privilege database credentials, dependency scanning, reverse-proxy/WAF
controls, monitoring, backups, credential rotation, and incident procedures.
These controls are not automatically supplied by running the local development
server.

## Security limitations

- JWT logout in the current MVP clears the client token but does not maintain a
  server-side revocation list.
- Browser storage token handling is weaker than an HttpOnly cookie flow.
- No CSRF mechanism is implemented for the current bearer-token design.
- No formal penetration test, load test, or compliance assessment has been
  performed.
- AI output validation reduces malformed or inappropriate output risk but does
  not guarantee factual correctness or unbiased assessment.
