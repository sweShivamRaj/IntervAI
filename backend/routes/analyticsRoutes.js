const express = require('express');
const { dashboard, overview, skills } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/dashboard', dashboard);
router.get('/overview', overview);
router.get('/skills', skills);

module.exports = router;
