const express = require('express');
const {
  create,
  list,
  getOne,
  start,
  questions,
  answer,
  report,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', create);
router.get('/', list);
router.post('/:id/start', start);
router.get('/:id/questions', questions);
router.post('/:id/answer', answer);
router.get('/:id/report', report);
router.get('/:id/result', report);
router.get('/:id', getOne);

module.exports = router;
