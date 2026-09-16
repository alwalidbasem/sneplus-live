const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/waitlist', require('./waitlist.routes'));
router.use('/products', require('./products.routes'));
router.use('/live', require('./live.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/admin', require('./admin.routes'));

// Bid routes mounted at /api/live/:liveId/... so they share the live prefix.
router.use('/live', require('./bids.routes'));

module.exports = router;
