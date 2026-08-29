# Project Overview

## Project title

**AI-Powered Adaptive Interview Platform**

## Summary

The AI-Powered Adaptive Interview Platform is a university Software Engineering
project for structured interview practice. A candidate creates a profile,
selects a target role and skills, answers a sequence of interview questions,
and receives a backend-generated report. The platform uses an AI provider when
configured, but remains usable through validated local question and evaluation
fallbacks.

The adaptive decision is made by the backend. Recent evaluated scores influence
the next question's difficulty, while topic-specific performance prevents a
weak result in one skill from automatically reducing difficulty in every other
skill.

## Problem and solution

Traditional practice interviews are commonly fixed: every candidate receives a
similar sequence regardless of performance. This can give strong candidates too
little challenge and leave developing candidates without enough reinforcement.

This platform combines personalized question generation, automated answer
evaluation, and a backend adaptive difficulty engine. The AI suggests question
content and feedback; the backend validates AI output, owns sequencing and
scoring rules, persists the session, and produces the final report.

## Core flow

```text
Candidate
  -> Profile
  -> Interview Setup
  -> AI Question (or validated fallback)
  -> Answer
  -> AI Evaluation (or safe heuristic fallback)
  -> Score
  -> Adaptive Difficulty
  -> Next Question
  -> Final Report
```

## Technology stack

| Area | Technology | Responsibility |
|---|---|---|
| Frontend | React, Vite, React Router, Tailwind CSS, Axios, Recharts | SPA screens, route guards, forms, reports, charts |
| Backend | Node.js, Express | REST API, authentication, authorization, orchestration |
| Database | MongoDB with Mongoose | Users, interviews, questions, answers, skill history |
| Authentication | JWT and bcryptjs | Bearer-token sessions and password hashing |
| AI integration | Configurable OpenAI-compatible endpoint or mock provider | Question generation and answer evaluation |
| Reliability | Built-in fallback question bank and heuristic evaluation | Continue an interview during AI failure |

## Main user types

- **Candidate:** manages a profile, starts interviews, submits answers, and
  views only their own history and reports.
- **Administrator:** signs in with an administrator account and reviews users,
  interviews, dashboard statistics, and fallback questions.

## Current project status

The system is an MVP suitable for demonstration and academic evaluation. It
supports text-based interview practice and the documented administrative
functions. Voice, video, live streaming, advanced anti-cheating, human review
workflows, and enterprise-scale operations are outside the current MVP.

## Important limitation

AI evaluation is automated feedback generated from a constrained response
format. It can be useful for practice, but it is not a perfect measurement of
knowledge, communication, or employability and should not be treated as a
replacement for human interviewer judgment.
