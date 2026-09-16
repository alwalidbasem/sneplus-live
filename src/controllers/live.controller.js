const liveModel = require('../models/live.model');
const liveService = require('../services/live.service');
const { success } = require('../utils/response');
const { isNonEmptyString } = require('../utils/validators');

async function listSessions(req, res, next) {
    const sessions = await liveModel.findSessions({ includeEnded: true });
    success(res, { sessions });
}

async function getSession(req, res, next) {
    const id = Number(req.params.id);
    const state = await liveService.getLiveState(id);
    if (!state) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Live session not found.' }
        });
    }
    const comments = await liveService.getRecentComments(id);
    success(res, { ...state, comments });
}

async function createSession(req, res, next) {
    if (!isNonEmptyString(req.body.title, 2, 200)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'A live title is required.' }
        });
    }
    const session = await liveModel.createSession({
        title: req.body.title.trim(),
        hostId: req.session.user.id
    });
    success(res, { session }, 201);
}

async function updateSession(req, res, next) {
    const id = Number(req.params.id);
    const fields = {};
    if (req.body.title) fields.title = req.body.title.trim();
    if (req.body.status && ['scheduled', 'paused'].includes(req.body.status)) {
        fields.status = req.body.status;
    }
    const session = await liveModel.updateSession(id, fields);
    success(res, { session });
}

async function getItems(req, res, next) {
    const items = await liveModel.findItemsBySession(Number(req.params.id));
    success(res, { items });
}

async function addItems(req, res, next) {
    const sessionId = Number(req.params.id);
    const productIds = req.body.product_ids;
    if (!Array.isArray(productIds) || !productIds.length || !productIds.every(Number.isInteger)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'product_ids must be an array of product IDs.' }
        });
    }
    const inserted = await liveModel.addItems(sessionId, productIds);
    success(res, { itemIds: inserted }, 201);
}

async function reorderItems(req, res, next) {
    const sessionId = Number(req.params.id);
    const orderedIds = req.body.item_ids;
    if (!Array.isArray(orderedIds) || !orderedIds.every(Number.isInteger)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'item_ids must be an array of item IDs in order.' }
        });
    }
    await liveModel.reorderItems(sessionId, orderedIds);
    success(res, { reordered: true });
}

async function removeItem(req, res, next) {
    const deleted = await liveModel.removeItem(Number(req.params.itemId));
    if (!deleted) {
        return res.status(400).json({
            success: false,
            error: { code: 'ITEM_NOT_REMOVABLE', message: 'Only pending items can be removed.' }
        });
    }
    success(res, { deletedId: deleted.id });
}

module.exports = {
    listSessions, getSession, createSession, updateSession,
    getItems, addItems, reorderItems, removeItem
};
