const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const adminService = require('../services/adminService');

function adminInputError(error, fallback) {
  if (error?.code === 'INVALID_FALLBACK_QUESTION') {
    return new AppError(error.message, 400, 'VALIDATION_ERROR');
  }
  if (error?.code === 11000) {
    return new AppError('A fallback question with this text already exists.', 400, 'DUPLICATE');
  }
  if (error?.name === 'CastError') {
    return new AppError('Fallback question not found.', 404, 'INVALID_ID');
  }
  return new AppError(fallback, 500, 'INTERNAL_ERROR');
}

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
    throw adminInputError(error, 'Unable to load fallback questions.');
  }
});

const createQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await adminService.createFallbackQuestion(req.body);
    res.status(201).json({ question });
  } catch (error) {
    throw adminInputError(error, 'Unable to create fallback question.');
  }
});

const updateQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await adminService.updateFallbackQuestion(req.params.id, req.body);
    res.json({ question });
  } catch (error) {
    throw adminInputError(error, 'Unable to update fallback question.');
  }
});

const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await adminService.deleteFallbackQuestion(req.params.id);
    res.json({ question, message: 'Fallback question deleted.' });
  } catch (error) {
    if (error?.message === 'Fallback question not found.') {
      throw new AppError('Fallback question not found.', 404, 'NOT_FOUND');
    }
    throw adminInputError(error, 'Unable to delete fallback question.');
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
