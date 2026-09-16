const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/helpers');

router.get('/dashboard', requireAdmin, asyncHandler(adminController.dashboard));
router.get('/stats', requireAdmin, asyncHandler(adminController.stats));

module.exports = router;
