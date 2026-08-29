# Data Models

## User
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| email | String | unique, required |
| password | String | bcrypt hash |
| role | String | `candidate` \| `admin` |
| profile | Object | education, experience, targetRoles[], skills[] |
| createdAt / updatedAt | Date | timestamps |

## Interview
| Field | Type | Notes |
|-------|------|-------|
| user | ObjectId → User | required |
| jobRole | String | e.g. Frontend Developer |
| skills | [String] | selected skills |
| status | String | `setup` \| `in_progress` \| `completed` |
| currentDifficulty | Number | 1–3 |
| topicDifficulties | [{ topic, difficulty }] | per-topic adaptive difficulty baselines |
| difficultyProgression | [{ order, topic, difficulty, score }] | recorded difficulty for each question |
| questionCount | Number | target questions (default 5) |
| scoreAverage | Number | filled on complete |
| summary | Object | strengths, weaknesses, recommendation, recommendedTopics, overallFeedback, overallFeedbackStatus |
| startedAt / completedAt | Date | |

## Question
| Field | Type | Notes |
|-------|------|-------|
| interviewId | ObjectId → Interview | required |
| questionText | String | question prompt |
| topic | String | selected interview topic |
| difficulty | Number | 1–3 |
| questionType | String | conceptual, scenario, coding, or design |
| expectedConcepts | [String] | private evaluator data; never returned to candidate |
| order | Number | sequence index |
| createdAt | Date | |

## Answer
| Field | Type | Notes |
|-------|------|-------|
| interviewId | ObjectId → Interview | required |
| questionId | ObjectId → Question | unique; one answer per question |
| userAnswer | String | candidate response |
| score | Number or null | 0–100 backend weighted score |
| evaluationStatus | String | `pending` \| `completed` \| `failed` |
| evaluation | Object | five dimension scores, feedback, strengths, weaknesses, improvementSuggestion |
| submittedAt | Date | |

## SkillPerformance
| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | canonical candidate identifier |
| user | ObjectId → User | legacy compatibility alias |
| skill | String | |
| attempts | Number | |
| averageScore | Number | |
| bestScore | Number | |
| updatedAt | Date | maintained by Mongoose timestamps |
| lastDifficulty | Number | |
| history | [{ interview, score, date }] | capped growth later |

Compound unique index: `(user, skill)`.
