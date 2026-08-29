const express = require('express');
const catalog = require('../data/rolesSkills');

const router = express.Router();

router.get('/meta/roles-skills', (req, res) => {
  res.json(catalog);
});

module.exports = router;
