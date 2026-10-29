const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { answerQuestion, retryEvaluation } = require('../controllers/interviewController');

const router = express.Router();

router.use(protect);
router.post('/:id/answer', answerQuestion);
router.post('/:id/evaluation/retry', retryEvaluation);

module.exports = router;
