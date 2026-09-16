const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../utils/helpers');

router.post('/register', loginLimiter, asyncHandler(authController.register));
router.post('/login', loginLimiter, asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.me));

module.exports = router;
