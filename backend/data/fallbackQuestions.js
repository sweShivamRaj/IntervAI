const QUESTION_BANK = [
  {
    topic: 'JavaScript',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between let, const, and var in JavaScript?',
    expectedConcepts: ['block scope', 'function scope', 'hoisting', 'reassignment'],
  },
  {
    topic: 'JavaScript',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'Explain event bubbling and capturing. How would you stop propagation?',
    expectedConcepts: ['event propagation', 'bubbling', 'capturing', 'stopPropagation'],
  },
  {
    topic: 'JavaScript',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'How does the JavaScript event loop handle microtasks versus macrotasks? Give an example.',
    expectedConcepts: ['call stack', 'event loop', 'microtask queue', 'macrotask queue'],
  },
  {
    topic: 'React',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between state and props in React?',
    expectedConcepts: ['props', 'state', 'component input', 're-rendering'],
  },
  {
    topic: 'React',
    difficulty: 2,
    questionType: 'scenario',
    questionText: 'When would you use useEffect, and how do you avoid infinite re-render loops?',
    expectedConcepts: ['side effects', 'dependency array', 'cleanup', 'render cycle'],
  },
  {
    topic: 'React',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'Compare controlled and uncontrolled components and discuss the performance implications of frequent state updates.',
    expectedConcepts: ['controlled input', 'uncontrolled input', 'refs', 'render performance'],
  },
  {
    topic: 'Node.js',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the Node.js event loop, and why is it useful for I/O-heavy applications?',
    expectedConcepts: ['single thread', 'event loop', 'non-blocking I/O', 'callbacks'],
  },
  {
    topic: 'Node.js',
    difficulty: 2,
    questionType: 'scenario',
    questionText: 'How would you structure error handling in a Node.js REST API?',
    expectedConcepts: ['middleware', 'centralized errors', 'status codes', 'async errors'],
  },
  {
    topic: 'Node.js',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'Explain worker threads or clustering in Node.js and when you would use them.',
    expectedConcepts: ['CPU-bound work', 'worker threads', 'processes', 'load distribution'],
  },
  {
    topic: 'Express',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is middleware in Express, and how does a request move through middleware functions?',
    expectedConcepts: ['middleware', 'request response cycle', 'next', 'route handler'],
  },
  {
    topic: 'Express',
    difficulty: 2,
    questionType: 'scenario',
    questionText: 'How would you validate request data and return consistent validation errors in an Express API?',
    expectedConcepts: ['input validation', 'schema', '400 status', 'error response'],
  },
  {
    topic: 'Express',
    difficulty: 3,
    questionType: 'design',
    questionText: 'How would you design authentication and authorization middleware for an Express application?',
    expectedConcepts: ['authentication', 'authorization', 'JWT', 'route protection'],
  },
  {
    topic: 'MongoDB',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between a document and a collection in MongoDB?',
    expectedConcepts: ['document', 'collection', 'BSON', 'schema flexibility'],
  },
  {
    topic: 'MongoDB',
    difficulty: 2,
    questionType: 'scenario',
    questionText: 'When should you create an index in MongoDB, and what are the trade-offs?',
    expectedConcepts: ['query performance', 'index', 'write cost', 'storage'],
  },
  {
    topic: 'MongoDB',
    difficulty: 3,
    questionType: 'design',
    questionText: 'Design a MongoDB schema for interview history with efficient queries by user and date. Discuss indexing.',
    expectedConcepts: ['document design', 'user reference', 'compound index', 'query pattern'],
  },
  {
    topic: 'SQL',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between INNER JOIN and LEFT JOIN?',
    expectedConcepts: ['matching rows', 'inner join', 'left join', 'null values'],
  },
  {
    topic: 'SQL',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'Explain database normalization from 1NF through 3NF with a short example.',
    expectedConcepts: ['atomic values', 'functional dependency', 'partial dependency', 'transitive dependency'],
  },
  {
    topic: 'SQL',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'How would you investigate and improve a slow SQL query used by an interview dashboard?',
    expectedConcepts: ['execution plan', 'indexes', 'query shape', 'performance measurement'],
  },
  {
    topic: 'Python',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What are the main differences between a list, tuple, set, and dictionary in Python?',
    expectedConcepts: ['mutability', 'ordering', 'uniqueness', 'key value mapping'],
  },
  {
    topic: 'Python',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'Explain list comprehensions versus generator expressions in Python and their memory implications.',
    expectedConcepts: ['iterable', 'lazy evaluation', 'memory usage', 'iteration'],
  },
  {
    topic: 'Python',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'How would you make a CPU-bound Python task faster, and what trade-offs would you consider?',
    expectedConcepts: ['profiling', 'multiprocessing', 'native code', 'GIL'],
  },
  {
    topic: 'Java',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between an interface and an abstract class in Java?',
    expectedConcepts: ['abstraction', 'inheritance', 'default methods', 'implementation'],
  },
  {
    topic: 'Java',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'Explain how the Java garbage collector works at a high level.',
    expectedConcepts: ['heap', 'unreachable objects', 'garbage collection', 'memory management'],
  },
  {
    topic: 'Java',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'How would you design a thread-safe cache in Java?',
    expectedConcepts: ['concurrency', 'synchronization', 'ConcurrentHashMap', 'eviction'],
  },
  {
    topic: 'C++',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between a pointer and a reference in C++?',
    expectedConcepts: ['address', 'nullability', 'alias', 'dereferencing'],
  },
  {
    topic: 'C++',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'Explain RAII and why it is important for resource management in C++.',
    expectedConcepts: ['resource ownership', 'constructor', 'destructor', 'scope'],
  },
  {
    topic: 'C++',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'Compare smart pointers in C++ and explain when unique_ptr or shared_ptr is appropriate.',
    expectedConcepts: ['ownership', 'unique_ptr', 'shared_ptr', 'weak_ptr'],
  },
  {
    topic: 'DSA',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'Explain the time complexity of binary search and when it can be applied.',
    expectedConcepts: ['sorted data', 'divide and conquer', 'logarithmic time', 'random access'],
  },
  {
    topic: 'DSA',
    difficulty: 2,
    questionType: 'scenario',
    questionText: 'How would you detect a cycle in a linked list? What is the complexity?',
    expectedConcepts: ['Floyd algorithm', 'slow pointer', 'fast pointer', 'linear time'],
  },
  {
    topic: 'DSA',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'Design an approach to find the k most frequent elements in a large stream. Discuss trade-offs.',
    expectedConcepts: ['frequency map', 'heap', 'streaming', 'space complexity'],
  },
  {
    topic: 'DBMS',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is a transaction in a DBMS, and what do the ACID properties mean?',
    expectedConcepts: ['atomicity', 'consistency', 'isolation', 'durability'],
  },
  {
    topic: 'DBMS',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'What is the purpose of database indexing, and when can an index hurt performance?',
    expectedConcepts: ['lookup speed', 'selectivity', 'write overhead', 'storage'],
  },
  {
    topic: 'DBMS',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'Explain transaction isolation levels and how they affect concurrent database operations.',
    expectedConcepts: ['dirty read', 'non-repeatable read', 'phantom read', 'locking'],
  },
  {
    topic: 'Operating Systems',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between a process and a thread?',
    expectedConcepts: ['address space', 'process', 'thread', 'context switching'],
  },
  {
    topic: 'Operating Systems',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'What causes a deadlock, and how can an operating system prevent or avoid it?',
    expectedConcepts: ['mutual exclusion', 'hold and wait', 'deadlock', 'prevention'],
  },
  {
    topic: 'Operating Systems',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'How do virtual memory and paging allow processes to use memory efficiently?',
    expectedConcepts: ['pages', 'page table', 'virtual address', 'page fault'],
  },
  {
    topic: 'Computer Networks',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the difference between TCP and UDP, and when would you use each?',
    expectedConcepts: ['connection oriented', 'reliability', 'datagrams', 'latency'],
  },
  {
    topic: 'Computer Networks',
    difficulty: 2,
    questionType: 'conceptual',
    questionText: 'Explain what happens when a browser loads a web page over HTTPS.',
    expectedConcepts: ['DNS', 'TCP', 'TLS', 'HTTP'],
  },

  {
  topic: 'Computer Networks',
  difficulty: 2,
  questionType: 'conceptual',
  questionText: 'Explain how TCP establishes a reliable connection between a client and a server using the three-way handshake. Why is each step necessary?',
  expectedConcepts: ['TCP', 'Three-Way Handshake', 'SYN', 'SYN-ACK', 'ACK', 'Reliable Connection'],
},

  {
    topic: 'Computer Networks',
    difficulty: 3,
    questionType: 'scenario',
    questionText: 'How would you diagnose intermittent high latency between an API and its database?',
    expectedConcepts: ['tracing', 'latency measurement', 'packet loss', 'connection pool'],
  },
  {
    topic: 'Software Engineering',
    difficulty: 1,
    questionType: 'conceptual',
    questionText: 'What is the purpose of version control, and what makes a good commit?',
    expectedConcepts: ['history', 'branching', 'small changes', 'descriptive message'],
  },
  {
    topic: 'Software Engineering',
    difficulty: 2,
    questionType: 'scenario',
    questionText: 'How would you choose unit, integration, and end-to-end tests for a web application?',
    expectedConcepts: ['test pyramid', 'isolation', 'integration', 'user flow'],
  },
  {
    topic: 'Software Engineering',
    difficulty: 3,
    questionType: 'design',
    questionText: 'Describe a maintainable software delivery process for a team building a production API.',
    expectedConcepts: ['code review', 'CI/CD', 'observability', 'rollback'],
  },
];

function getFallbackQuestion({ topic, skill, difficulty, usedQuestionTexts = [] }) {
  const requestedTopic = String(topic || skill || '').trim().toLowerCase();
  const targetDifficulty = Number(difficulty) || 2;
  const used = new Set(usedQuestionTexts);
  const topicQuestions = QUESTION_BANK.filter(
    (question) => question.topic.toLowerCase() === requestedTopic
  );
  const difficultyQuestions = topicQuestions.filter(
    (question) => question.difficulty === targetDifficulty && !used.has(question.questionText)
  );
  const topicDifficultyQuestions = topicQuestions.filter(
    (question) => question.difficulty === targetDifficulty
  );
  const unusedTopicQuestions = topicQuestions.filter(
    (question) => !used.has(question.questionText)
  );
  const fallbackQuestions = QUESTION_BANK.filter(
    (question) => question.difficulty === targetDifficulty && !used.has(question.questionText)
  );
  const pool = difficultyQuestions.length
    ? difficultyQuestions
    : unusedTopicQuestions.length
      ? unusedTopicQuestions
      : topicDifficultyQuestions.length
        ? topicDifficultyQuestions
        : fallbackQuestions.length
          ? fallbackQuestions
          : QUESTION_BANK;
  const selected = pool[Math.floor(Math.random() * pool.length)] || QUESTION_BANK[0];
  let questionText = selected.questionText;
  let variant = 1;
  while (used.has(questionText)) {
    questionText = `${selected.questionText} Follow-up ${variant}: include a different example or trade-off.`;
    variant += 1;
  }

  return {
    ...selected,
    difficulty: targetDifficulty,
    questionText,
    // Compatibility aliases for the earlier service abstraction. The
    // interview engine persists and returns the Phase 4 field names above.
    text: questionText,
    source: 'fallback',
  };
}

function heuristicEvaluate({ answer, expectedConcepts = [] }) {
  const normalizedAnswer = String(answer || '').trim();
  const words = normalizedAnswer.split(/\s+/).filter(Boolean);
  const lowerAnswer = normalizedAnswer.toLowerCase();
  const matchedConcepts = expectedConcepts.filter((concept) =>
    lowerAnswer.includes(String(concept).toLowerCase())
  );
  const conceptScore = expectedConcepts.length
    ? (matchedConcepts.length / expectedConcepts.length) * 70
    : 0;
  const detailScore = Math.min(30, words.length * 0.75);
  const score = Math.max(0, Math.min(100, Math.round(conceptScore + detailScore)));

  const evaluation = matchedConcepts.length
    ? `Your answer covered ${matchedConcepts.length} of ${expectedConcepts.length} key concepts. Add concrete examples and explain trade-offs where possible.`
    : 'Your answer needs more coverage of the core concepts. Structure it with a definition, an example, and important trade-offs.';

  return {
    score,
    evaluation,
    // Compatibility aliases for callers of the earlier evaluator abstraction.
    feedback: evaluation,
    strengths: matchedConcepts.length ? ['Mentioned relevant concepts'] : [],
    improvements: ['Add concrete examples and explain trade-offs'],
  };
}

module.exports = {
  QUESTION_BANK,
  BANK: QUESTION_BANK,
  getFallbackQuestion,
  heuristicEvaluate,
};
