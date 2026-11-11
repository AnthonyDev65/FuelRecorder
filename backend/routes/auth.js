const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateJWT, authController.me);
router.post('/register', authenticateJWT, authController.register);

module.exports = router;
