const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getProcedureTypes } = require('../controllers/procedureTypeController');

// Returns an empty list; kept only for backwards compatibility
router.get('/', authenticateToken, getProcedureTypes);

module.exports = router;


