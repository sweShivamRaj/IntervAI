# Problem Statement

## Background

Interview preparation often relies on static question lists, repeated mock
interviews, or informal feedback. These approaches can be difficult to
personalize and may not show a candidate how their performance should influence
the next practice task.

## Problem

Traditional interviews and many interview-practice tools follow a fixed path.
They do not dynamically adapt the topic or difficulty when a candidate gives a
strong or weak answer. Feedback may also be delayed, inconsistent, or spread
across several tools. As a result:

- a candidate who is performing strongly may not receive a more challenging
  question;
- a candidate struggling with a topic may not receive targeted reinforcement;
- progress across skills and sessions is difficult to compare; and
- an isolated AI failure can interrupt a practice session if no fallback exists.

## Proposed problem boundary

The project addresses adaptive, text-based technical interview practice for a
candidate who wants immediate structured feedback. It does not attempt to
automatically make hiring decisions or replace a professional interviewer.

## Proposed solution

Provide a web application that:

1. stores a candidate profile and selected interview focus;
2. generates personalized questions using role, topic, difficulty, and recent
   performance context;
3. evaluates answers into validated dimensions and a backend-calculated score;
4. selects the next topic and difficulty using deterministic backend rules;
5. persists the complete session and produces a final report; and
6. uses safe fallback questions and heuristic evaluation when an AI provider is
   unavailable or returns invalid output.
