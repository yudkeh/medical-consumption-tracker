const express = require('express');
const router = express.Router();
const { adminLogin, listUsers, resetUserPassword } = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/adminAuth');

// Admin login (env-based credentials)
router.post('/login', adminLogin);

// Protected admin APIs
router.get('/users', authenticateAdmin, listUsers);
router.put('/users/:id/password', authenticateAdmin, resetUserPassword);

module.exports = router;


