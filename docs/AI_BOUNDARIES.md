# AI Integration Boundaries

## Principle
The frontend never talks to the AI provider. The backend-only
`backend/services/aiService.js` generates questions and
`backend/services/evaluationService.js` evaluates answers. Provider calls
return validated plain data and do not persist interview domain records. The
fallback-question helper may query the managed fallback-question collection
when a live database is available.

## Interface
```js
generateInterviewQuestion({
  jobRole,
  interviewType,
  selectedSkills,
  currentTopic,
  currentDifficulty,
  previousQuestions,
  recentPerformance,
})
  → { question, topic, difficulty, type, expectedConcepts[] }

evaluateAnswer({ question, answer, jobRole, skill, difficulty })
  → { score, feedback, strengths[], improvements[] }

evaluateCandidateAnswer({ question, expectedConcepts, candidateAnswer,
  candidateRole, topic, difficulty })
  → { status, score, evaluation: {
      correctness, relevance, technicalDepth, clarity, completeness,
      feedback, strengths[], weaknesses[], improvementSuggestion
    }}
```

## Configuration
- `AI_PROVIDER` = `openai` | `mock` (default `mock` for local demo without keys)
- `AI_API_KEY` = secret (server `.env` only)
- `AI_MODEL` = optional model name
- `AI_BASE_URL` = optional OpenAI-compatible API base URL
- `AI_TIMEOUT_MS` / `AI_MAX_RETRIES` = request safety settings

## Question generation behavior
1. Build a context from the backend-owned interview state.
2. Ask the configured provider for one structured question.
3. Validate role/topic/difficulty/type/content, expected concepts, and duplicate safety.
4. Retry invalid/provider-failed responses, then use `backend/data/fallbackQuestions.js`.
5. Keep `expectedConcepts` server-side and omit them from candidate responses.

### Answer evaluation behavior
1. Persist the candidate answer with `evaluationStatus=pending` before contacting a provider.
2. Ask the configured provider for one structured evaluation.
3. Validate every dimension, feedback field, and array before persistence.
4. Calculate the final weighted score on the backend; frontend scores are ignored.
5. Retry invalid/provider-failed responses, then use a safe heuristic fallback and mark the evaluation `failed`.
6. Return only candidate-safe feedback; provider errors and internal prompts stay server-side.

## Backend ownership
The backend selects the current topic, owns question order and difficulty, validates
AI results, calculates answer scores, stores questions/answers, and keeps
`expectedConcepts` and internal prompts private.

## Adaptive difficulty
`backend/services/adaptiveService.js` is the authoritative difficulty engine. It
uses the last three evaluated scores, enforces Easy–Hard boundaries, tracks
topic-specific performance, and stores the resulting progression on `Interview`.
The AI provider receives the already-selected topic and difficulty; it cannot
choose or persist the next difficulty.
