const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/helpers');

router.get('/', requireAuth, asyncHandler(ordersController.listOrders));
router.get('/:id', requireAuth, asyncHandler(ordersController.getOrder));

module.exports = router;
