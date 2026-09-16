const express = require('express');
const router = express.Router();
const liveController = require('../controllers/live.controller');
const simulatorConfigController = require('../controllers/simulator.config.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/helpers');

router.get('/', asyncHandler(liveController.listSessions));
router.post('/', requireAdmin, asyncHandler(liveController.createSession));
router.get('/simulator-config', asyncHandler(simulatorConfigController.getConfig));
router.put('/simulator-config', requireAdmin, asyncHandler(simulatorConfigController.updateConfig));
router.get('/:id', asyncHandler(liveController.getSession));
router.put('/:id', requireAdmin, asyncHandler(liveController.updateSession));

router.get('/:id/items', asyncHandler(liveController.getItems));
router.post('/:id/items', requireAdmin, asyncHandler(liveController.addItems));
router.put('/:id/items/reorder', requireAdmin, asyncHandler(liveController.reorderItems));
router.delete('/:id/items/:itemId', requireAdmin, asyncHandler(liveController.removeItem));

module.exports = router;
