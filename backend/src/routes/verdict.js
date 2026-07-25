const express = require('express');
const router = express.Router();
const verdictController = require('../controllers/verdictController');

// Route definitions
router.get('/:username', verdictController.getVerdict);

module.exports = router;
