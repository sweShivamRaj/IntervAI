const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Interview Platform API is running',
  });
});

module.exports = router;
