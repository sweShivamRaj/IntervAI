const { asyncHandler } = require('../middleware/errorMiddleware');
const interviewService = require('../services/interviewService');
const {
  validateInterviewCreate,
  validateAnswerPayload,
  validateObjectIdParam,
} = require('../validators/interviewValidator');

const create = asyncHandler(async (req, res) => {
  const payload = validateInterviewCreate(req.body);
  const interview = await interviewService.createInterview(req.user._id, payload);
  res.status(201).json({ interview });
});

const list = asyncHandler(async (req, res) => {
  const interviews = await interviewService.listInterviews(req.user._id);
  res.json({ interviews });
});

const getOne = asyncHandler(async (req, res) => {
  validateObjectIdParam(req.params.id, 'Interview');
  const detail = await interviewService.getInterviewDetail(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.json(detail);
});

const start = asyncHandler(async (req, res) => {
  validateObjectIdParam(req.params.id, 'Interview');
  const result = await interviewService.startInterview(req.params.id, req.user._id);
  res.json(result);
});

const questions = asyncHandler(async (req, res) => {
  validateObjectIdParam(req.params.id, 'Interview');
  const result = await interviewService.getInterviewQuestions(req.params.id, req.user._id);
  res.json(result);
});

const answer = asyncHandler(async (req, res) => {
  validateObjectIdParam(req.params.id, 'Interview');
  const payload = validateAnswerPayload({ ...req.body, interviewId: req.params.id });
  const questionId = req.body?.questionId;
  validateObjectIdParam(questionId, 'Question');
  const result = await interviewService.submitAnswer(questionId, req.user._id, payload);
  res.json(result);
});

const answerQuestion = asyncHandler(async (req, res) => {
  validateObjectIdParam(req.params.id, 'Question');
  const payload = validateAnswerPayload(req.body);
  const result = await interviewService.submitAnswer(req.params.id, req.user._id, payload);
  res.json(result);
});

const report = asyncHandler(async (req, res) => {
  validateObjectIdParam(req.params.id, 'Interview');
  const reportData = await interviewService.getReport(req.params.id, req.user._id);
  res.json({ report: reportData });
});

module.exports = { create, list, getOne, start, questions, answer, answerQuestion, report };
