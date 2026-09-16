const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlist.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { waitlistLimiter } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../utils/helpers');

router.post('/', waitlistLimiter, asyncHandler(waitlistController.joinWaitlist));
router.get('/', requireAdmin, asyncHandler(waitlistController.listWaitlist));

module.exports = router;
