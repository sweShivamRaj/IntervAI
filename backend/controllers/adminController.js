const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const adminService = require('../services/adminService');

const dashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard();
  res.json(data);
});

const listUsers = asyncHandler(async (req, res) => {
  res.json({ users: await adminService.listUsers() });
});

const listInterviews = asyncHandler(async (req, res) => {
  res.json({ interviews: await adminService.listInterviews() });
});

const listQuestions = asyncHandler(async (req, res) => {
  try {
    res.json({ questions: await adminService.listFallbackQuestions(req.query) });
  } catch (error) {
    throw new AppError(error.message || 'Failed to list fallback questions.', 400);
  }
});

const createQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await adminService.createFallbackQuestion(req.body);
    res.status(201).json({ question });
  } catch (error) {
    if (error?.code === 11000) throw new AppError('A fallback question with this text already exists.', 400);
    throw new AppError(error.message || 'Invalid fallback question.', 400);
  }
});

const updateQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await adminService.updateFallbackQuestion(req.params.id, req.body);
    res.json({ question });
  } catch (error) {
    if (error?.code === 11000) throw new AppError('A fallback question with this text already exists.', 400);
    throw new AppError(error.message || 'Invalid fallback question.', error.message === 'Fallback question not found.' ? 404 : 400);
  }
});

const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await adminService.deleteFallbackQuestion(req.params.id);
    res.json({ question, message: 'Fallback question deleted.' });
  } catch (error) {
    throw new AppError(error.message || 'Fallback question not found.', 404);
  }
});

module.exports = {
  dashboard,
  listUsers,
  listInterviews,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
