const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { answerQuestion } = require('../controllers/interviewController');

const router = express.Router();

router.use(protect);
router.post('/:id/answer', answerQuestion);

module.exports = router;
