# Mermaid Diagrams

These diagrams describe the current MVP at a logical level. They are intended
for design review and university project documentation; they do not imply
features that are outside the implemented text-based workflow.

## 1. System Architecture Diagram

```mermaid
flowchart LR
    C[Candidate] --> FE[React frontend]
    A[Administrator] --> FE
    FE -->|HTTPS JSON + JWT| API[Express REST API]
    API --> MW[Helmet, CORS, rate limit, validation]
    API --> AUTH[JWT authentication and role authorization]
    API --> INT[Interview orchestration]
    API --> ADM[Admin services]
    INT --> ADAPT[Adaptive difficulty engine]
    INT --> AI[AI service layer]
    AI --> PROVIDER[AI provider]
    AI --> FALLBACK[Fallback questions and heuristic evaluation]
    INT --> DB[(MongoDB / Mongoose)]
    ADM --> DB
    AUTH --> DB
```

## 2. Use Case Diagram

Mermaid does not provide a universal native UML use-case syntax, so this
flowchart uses actors and a system boundary to express the same relationships.

```mermaid
flowchart LR
    Candidate((Candidate))
    Admin((Administrator))
    subgraph Platform[IntervAI]
        UC1([Register / sign in])
        UC2([Manage profile])
        UC3([Configure interview])
        UC4([Answer adaptive questions])
        UC5([View report and analytics])
        UC6([View platform dashboard])
        UC7([Manage fallback questions])
        UC8([View users and interviews])
    end
    Candidate --> UC1
    Candidate --> UC2
    Candidate --> UC3
    Candidate --> UC4
    Candidate --> UC5
    Admin --> UC1
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
```

## 3. DFD Level 0 (Context Diagram)

```mermaid
flowchart LR
    C[Candidate] -->|Profile, setup, answers| P((IntervAI))
    A[Administrator] -->|Admin requests and question updates| P
    P -->|Questions, evaluations, reports| C
    P -->|Statistics, lists, operation results| A
    P <-->|Interview and account records| D[(MongoDB)]
    P <-->|Validated question/evaluation request| AI[AI Provider]
```

## 4. DFD Level 1 (Interview Session)

```mermaid
flowchart TD
    C[Candidate] --> P1[1. Authenticate and load profile]
    P1 --> D1[(User data)]
    C --> P2[2. Submit interview setup]
    P2 --> D2[(Interview data)]
    D2 --> P3[3. Select topic and difficulty]
    P3 --> P4[4. Generate and validate question]
    P4 --> AI[AI provider]
    P4 --> FB[Fallback bank if needed]
    P4 --> D3[(Question data)]
    D3 --> C
    C -->|Answer| P5[5. Store and evaluate answer]
    P5 --> D4[(Answer data)]
    P5 --> P6[6. Calculate score and adaptive decision]
    D4 --> P6
    P6 --> D2
    P6 --> P3
    P6 --> P7[7. Build final report]
    P7 --> D5[(Skill performance and summary)]
    P7 --> C
```

## 5. ER Diagram

```mermaid
erDiagram
    USER ||--o{ INTERVIEW : owns
    INTERVIEW ||--o{ QUESTION : contains
    INTERVIEW ||--o{ ANSWER : receives
    QUESTION ||--o| ANSWER : has
    USER ||--o{ SKILL_PERFORMANCE : accumulates
    USER {
        ObjectId _id
        string email
        string role
    }
    INTERVIEW {
        ObjectId _id
        ObjectId user
        string status
        int questionCount
        number scoreAverage
    }
    QUESTION {
        ObjectId _id
        ObjectId interviewId
        int order
        int difficulty
    }
    ANSWER {
        ObjectId _id
        ObjectId interviewId
        ObjectId questionId
        number score
        string evaluationStatus
    }
    SKILL_PERFORMANCE {
        ObjectId _id
        ObjectId userId
        string skill
        number averageScore
    }
    FALLBACK_QUESTION {
        ObjectId _id
        string questionText
        string topic
        int difficulty
    }
```

## 6. Class Diagram

```mermaid
classDiagram
    class AuthMiddleware {
        +protect(request, response, next)
        +authorize(roles)
    }
    class InterviewController {
        +create()
        +start()
        +questions()
        +answer()
        +report()
    }
    class AdminController {
        +dashboard()
        +listUsers()
        +listInterviews()
        +listQuestions()
        +createQuestion()
        +updateQuestion()
        +deleteQuestion()
    }
    class AdminService {
        +getDashboard()
        +listUsers()
        +listInterviews()
        +listFallbackQuestions()
    }
    class InterviewService {
        +createInterview()
        +startInterview()
        +getInterviewQuestions()
        +submitAnswer()
        +getReport()
    }
    class AIService {
        +generateInterviewQuestion()
        +validateInterviewQuestion()
    }
    class EvaluationService {
        +evaluateCandidateAnswer()
        +validateEvaluationResponse()
        +calculateWeightedScore()
    }
    class AdaptiveService {
        +computeAdaptiveDecision()
        +computeNextDifficulty()
        +clampDifficulty()
    }
    class User
    class Interview
    class Question
    class Answer
    AuthMiddleware --> User : loads
    InterviewController --> InterviewService : delegates
    AdminController --> AdminService : delegates
    AdminService --> User : reads
    AdminService --> Interview : reads
    InterviewService --> AIService : requests question
    InterviewService --> EvaluationService : evaluates answer
    InterviewService --> AdaptiveService : selects next difficulty
    InterviewService --> Interview
    InterviewService --> Question
    InterviewService --> Answer
    InterviewService --> User : ownership
```

## 7. Sequence Diagram (Answer Submission)

```mermaid
sequenceDiagram
    actor Candidate
    participant UI as React UI
    participant API as Express API
    participant Auth as Auth and ownership middleware
    participant Service as Interview service
    participant DB as MongoDB
    participant AI as AI evaluator
    participant Adapt as Adaptive engine

    Candidate->>UI: Submit answer
    UI->>API: POST /questions/:id/answer + JWT
    API->>Auth: Verify JWT and resource ownership
    Auth-->>API: Authorized user
    API->>Service: Validate current question and answer
    Service->>DB: Persist answer as pending
    Service->>AI: Evaluate answer
    alt Provider succeeds
        AI-->>Service: Valid structured evaluation
    else Provider fails or times out
        AI-->>Service: Fallback evaluation
    end
    Service->>Adapt: Calculate score and next difficulty
    Adapt-->>Service: Next topic and difficulty
    Service->>DB: Store evaluation and interview progress
    Service-->>API: Evaluation and next question/report
    API-->>UI: Candidate-safe JSON response
    UI-->>Candidate: Show feedback or final report
```

## 8. Activity Diagram (Interview Lifecycle)

```mermaid
flowchart TD
    Start([Start]) --> Auth{Authenticated?}
    Auth -- No --> Login[Sign in or register]
    Login --> Auth
    Auth -- Yes --> Profile[Load profile]
    Profile --> Setup[Choose role, skills, format, difficulty, count]
    Setup --> Store[Create interview]
    Store --> Generate[Generate question using AI]
    Generate --> Valid{Question valid?}
    Valid -- No or unavailable --> Fallback[Select validated fallback question]
    Valid -- Yes --> Show[Show current question]
    Fallback --> Show
    Show --> Answer[Candidate writes answer]
    Answer --> NonEmpty{Answer non-empty?}
    NonEmpty -- No --> Answer
    NonEmpty -- Yes --> Save[Persist answer]
    Save --> Evaluate[Evaluate with AI or heuristic fallback]
    Evaluate --> Score[Calculate backend score]
    Score --> Adapt[Update topic performance and difficulty]
    Adapt --> More{Questions remaining?}
    More -- Yes --> Generate
    More -- No --> Report[Build and store final report]
    Report --> End([End])
```
