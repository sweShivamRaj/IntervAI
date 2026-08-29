const express = require('express');
const {
  dashboard,
  listUsers,
  listInterviews,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.get('/interviews', listInterviews);
router.get('/questions', listQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

module.exports = router;
