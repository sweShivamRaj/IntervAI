import api from './api.js';

export const getDashboard = () => api.get('/analytics/dashboard');
export const fetchRolesSkills = () => api.get('/meta/roles-skills');
export const updateProfile = (payload) => api.put('/profile', payload);
export const createInterview = (payload) => api.post('/interviews', payload);
export const listInterviews = () => api.get('/interviews');
export const getInterview = (id) => api.get(`/interviews/${id}`);
export const startInterview = (id) => api.post(`/interviews/${id}/start`);
export const getInterviewQuestions = (id) => api.get(`/interviews/${id}/questions`);
export const submitAnswer = (questionId, payload) =>
  api.post(`/questions/${questionId}/answer`, payload);
export const getReport = (id) => api.get(`/interviews/${id}/report`);
export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getSkillAnalytics = () => api.get('/analytics/skills');
export const adminGetDashboard = () => api.get('/admin/dashboard');
export const adminListUsers = () => api.get('/admin/users');
export const adminListInterviews = () => api.get('/admin/interviews');
export const adminListQuestions = (params) => api.get('/admin/questions', { params });
export const adminCreateQuestion = (payload) => api.post('/admin/questions', payload);
export const adminUpdateQuestion = (id, payload) => api.put(`/admin/questions/${id}`, payload);
export const adminDeleteQuestion = (id) => api.delete(`/admin/questions/${id}`);
