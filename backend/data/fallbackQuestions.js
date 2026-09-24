// const QUESTION_BANK = [
//   {
//     topic: 'JavaScript',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is let in JavaScript?',
//     expectedConcepts: ['block scope', 'function scope', 'hoisting', 'reassignment'],
//   },
//   {
//     topic: 'JavaScript',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is event bubbling in JavaScript?',
//     expectedConcepts: ['event propagation', 'bubbling', 'capturing', 'stopPropagation'],
//   },
//   {
//     topic: 'JavaScript',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is the event loop in JavaScript?',
//     expectedConcepts: ['call stack', 'event loop', 'microtask queue', 'macrotask queue'],
//   },

//   {
//     topic: 'React',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What are props in React?',
//     expectedConcepts: ['props', 'state', 'component input', 're-rendering'],
//   },
//   {
//     topic: 'React',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is useEffect in React?',
//     expectedConcepts: ['side effects', 'dependency array', 'cleanup', 'render cycle'],
//   },
//   {
//     topic: 'React',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is a controlled component in React?',
//     expectedConcepts: ['controlled input', 'uncontrolled input', 'refs', 'render performance'],
//   },

//   {
//     topic: 'Node.js',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is Node.js event loop?',
//     expectedConcepts: ['single thread', 'event loop', 'non-blocking I/O', 'callbacks'],
//   },
//   {
//     topic: 'Node.js',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'How do you handle an error in Node.js?',
//     expectedConcepts: ['middleware', 'centralized errors', 'status codes', 'async errors'],
//   },
//   {
//     topic: 'Node.js',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What are worker threads in Node.js?',
//     expectedConcepts: ['CPU-bound work', 'worker threads', 'processes', 'load distribution'],
//   },

//   {
//     topic: 'Express',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is middleware in Express?',
//     expectedConcepts: ['middleware', 'request response cycle', 'next', 'route handler'],
//   },
//   {
//     topic: 'Express',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'Why do we validate data in an Express API?',
//     expectedConcepts: ['input validation', 'schema', '400 status', 'error response'],
//   },
//   {
//     topic: 'Express',
//     difficulty: 1,
//     questionType: 'design',
//     questionText: 'What is authentication in Express?',
//     expectedConcepts: ['authentication', 'authorization', 'JWT', 'route protection'],
//   },

//   {
//     topic: 'MongoDB',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is a document in MongoDB?',
//     expectedConcepts: ['document', 'collection', 'BSON', 'schema flexibility'],
//   },
//   {
//     topic: 'MongoDB',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'Why do we use an index in MongoDB?',
//     expectedConcepts: ['query performance', 'index', 'write cost', 'storage'],
//   },
//   {
//     topic: 'MongoDB',
//     difficulty: 1,
//     questionType: 'design',
//     questionText: 'How can you store interview history in MongoDB?',
//     expectedConcepts: ['document design', 'user reference', 'compound index', 'query pattern'],
//   },

//   {
//     topic: 'SQL',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is INNER JOIN in SQL?',
//     expectedConcepts: ['matching rows', 'inner join', 'left join', 'null values'],
//   },
//   {
//     topic: 'SQL',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is database normalization?',
//     expectedConcepts: ['atomic values', 'functional dependency', 'partial dependency', 'transitive dependency'],
//   },
//   {
//     topic: 'SQL',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'Why can an SQL query become slow?',
//     expectedConcepts: ['execution plan', 'indexes', 'query shape', 'performance measurement'],
//   },

//   {
//     topic: 'Python',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is a list in Python?',
//     expectedConcepts: ['mutability', 'ordering', 'uniqueness', 'key value mapping'],
//   },
//   {
//     topic: 'Python',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is list comprehension in Python?',
//     expectedConcepts: ['iterable', 'lazy evaluation', 'memory usage', 'iteration'],
//   },
//   {
//     topic: 'Python',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'How can you make a Python program faster?',
//     expectedConcepts: ['profiling', 'multiprocessing', 'native code', 'GIL'],
//   },

//   {
//     topic: 'Java',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is an interface in Java?',
//     expectedConcepts: ['abstraction', 'inheritance', 'default methods', 'implementation'],
//   },
//   {
//     topic: 'Java',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is garbage collection in Java?',
//     expectedConcepts: ['heap', 'unreachable objects', 'garbage collection', 'memory management'],
//   },
//   {
//     topic: 'Java',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is a thread in Java?',
//     expectedConcepts: ['concurrency', 'synchronization', 'ConcurrentHashMap', 'eviction'],
//   },

//   {
//     topic: 'C++',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is a pointer in C++?',
//     expectedConcepts: ['address', 'nullability', 'alias', 'dereferencing'],
//   },
//   {
//     topic: 'C++',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is RAII in C++?',
//     expectedConcepts: ['resource ownership', 'constructor', 'destructor', 'scope'],
//   },
//   {
//     topic: 'C++',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is a smart pointer in C++?',
//     expectedConcepts: ['ownership', 'unique_ptr', 'shared_ptr', 'weak_ptr'],
//   },

//   {
//     topic: 'DSA',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is binary search?',
//     expectedConcepts: ['sorted data', 'divide and conquer', 'logarithmic time', 'random access'],
//   },
//   {
//     topic: 'DSA',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'How can you find a cycle in a linked list?',
//     expectedConcepts: ['Floyd algorithm', 'slow pointer', 'fast pointer', 'linear time'],
//   },
//   {
//     topic: 'DSA',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'How can you find the most frequent elements in an array?',
//     expectedConcepts: ['frequency map', 'heap', 'streaming', 'space complexity'],
//   },

//   {
//     topic: 'DBMS',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is a transaction in DBMS?',
//     expectedConcepts: ['atomicity', 'consistency', 'isolation', 'durability'],
//   },
//   {
//     topic: 'DBMS',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is an index in DBMS?',
//     expectedConcepts: ['lookup speed', 'selectivity', 'write overhead', 'storage'],
//   },
//   {
//     topic: 'DBMS',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What happens when two users update the same data at the same time?',
//     expectedConcepts: ['dirty read', 'non-repeatable read', 'phantom read', 'locking'],
//   },

//   {
//     topic: 'Operating Systems',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is a process in an operating system?',
//     expectedConcepts: ['address space', 'process', 'thread', 'context switching'],
//   },
//   {
//     topic: 'Operating Systems',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is deadlock?',
//     expectedConcepts: ['mutual exclusion', 'hold and wait', 'deadlock', 'prevention'],
//   },
//   {
//     topic: 'Operating Systems',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is virtual memory?',
//     expectedConcepts: ['pages', 'page table', 'virtual address', 'page fault'],
//   },

//   {
//     topic: 'Computer Networks',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is TCP?',
//     expectedConcepts: ['connection oriented', 'reliability', 'datagrams', 'latency'],
//   },
//   {
//     topic: 'Computer Networks',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What happens when you open a website?',
//     expectedConcepts: ['DNS', 'TCP', 'TLS', 'HTTP'],
//   },
//   {
//     topic: 'Computer Networks',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is the TCP three-way handshake?',
//     expectedConcepts: ['TCP', 'Three-Way Handshake', 'SYN', 'SYN-ACK', 'ACK', 'Reliable Connection'],
//   },
//   {
//     topic: 'Computer Networks',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'Why can an API become slow?',
//     expectedConcepts: ['tracing', 'latency measurement', 'packet loss', 'connection pool'],
//   },

//   {
//     topic: 'Software Engineering',
//     difficulty: 1,
//     questionType: 'conceptual',
//     questionText: 'What is Git?',
//     expectedConcepts: ['history', 'branching', 'small changes', 'descriptive message'],
//   },
//   {
//     topic: 'Software Engineering',
//     difficulty: 1,
//     questionType: 'scenario',
//     questionText: 'What is unit testing?',
//     expectedConcepts: ['test pyramid', 'isolation', 'integration', 'user flow'],
//   },
//   {
//     topic: 'Software Engineering',
//     difficulty: 1,
//     questionType: 'design',
//     questionText: 'What is a software delivery process?',
//     expectedConcepts: ['code review', 'CI/CD', 'observability', 'rollback'],
//   },
// ];

// function getFallbackQuestion({ topic, skill, difficulty, usedQuestionTexts = [] }) {
//   const requestedTopic = String(topic || skill || '').trim().toLowerCase();
//   const targetDifficulty = Number(difficulty) || 1;
//   const used = new Set(usedQuestionTexts);

//   const topicQuestions = QUESTION_BANK.filter(
//     (question) => question.topic.toLowerCase() === requestedTopic
//   );

//   const difficultyQuestions = topicQuestions.filter(
//     (question) =>
//       question.difficulty === targetDifficulty &&
//       !used.has(question.questionText)
//   );

//   const topicDifficultyQuestions = topicQuestions.filter(
//     (question) => question.difficulty === targetDifficulty
//   );

//   const unusedTopicQuestions = topicQuestions.filter(
//     (question) => !used.has(question.questionText)
//   );

//   const fallbackQuestions = QUESTION_BANK.filter(
//     (question) =>
//       question.difficulty === targetDifficulty &&
//       !used.has(question.questionText)
//   );

//   const pool = difficultyQuestions.length
//     ? difficultyQuestions
//     : unusedTopicQuestions.length
//       ? unusedTopicQuestions
//       : topicDifficultyQuestions.length
//         ? topicDifficultyQuestions
//         : fallbackQuestions.length
//           ? fallbackQuestions
//           : QUESTION_BANK;

//   const selected =
//     pool[Math.floor(Math.random() * pool.length)] || QUESTION_BANK[0];

//   let questionText = selected.questionText;
//   let variant = 1;

//   while (used.has(questionText)) {
//     questionText = `${selected.questionText} Follow-up ${variant}: give a simple example.`;
//     variant += 1;
//   }

//   return {
//     ...selected,
//     difficulty: targetDifficulty,
//     questionText,
//     text: questionText,
//     source: 'fallback',
//   };
// }

// function heuristicEvaluate({ answer, expectedConcepts = [] }) {
//   const normalizedAnswer = String(answer || '').trim();
//   const words = normalizedAnswer.split(/\s+/).filter(Boolean);
//   const lowerAnswer = normalizedAnswer.toLowerCase();

//   const matchedConcepts = expectedConcepts.filter((concept) =>
//     lowerAnswer.includes(String(concept).toLowerCase())
//   );

//   const conceptScore = expectedConcepts.length
//     ? (matchedConcepts.length / expectedConcepts.length) * 70
//     : 0;

//   const detailScore = Math.min(30, words.length * 0.75);

//   const score = Math.max(
//     0,
//     Math.min(100, Math.round(conceptScore + detailScore))
//   );

//   const evaluation = matchedConcepts.length
//     ? `Your answer covered ${matchedConcepts.length} of ${expectedConcepts.length} key concepts.`
//     : 'Your answer needs more coverage of the basic concepts.';

//   return {
//     score,
//     evaluation,
//     feedback: evaluation,
//     strengths: matchedConcepts.length
//       ? ['Mentioned relevant concepts']
//       : [],
//     improvements: ['Add a simple example if possible'],
//   };
// }

// module.exports = {
//   QUESTION_BANK,
//   BANK: QUESTION_BANK,
//   getFallbackQuestion,
//   heuristicEvaluate,
// };
