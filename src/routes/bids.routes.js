const express = require('express');
const router = express.Router();
const bidsController = require('../controllers/bids.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/helpers');

// Bid history — live session level is admin-only; per-item bids are public read.
router.get('/:liveId/bids', requireAdmin, asyncHandler(bidsController.listSessionBids));
router.get('/:liveId/items/:itemId/bids', asyncHandler(bidsController.listItemBids));

module.exports = router;
