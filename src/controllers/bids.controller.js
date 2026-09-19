const bidModel = require('../models/bid.model');
const { success, failure } = require('../utils/response');

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

async function listSessionBids(req, res, next) {
    const id = parseId(req.params.liveId);
    if (!id) return failure(res, 'VALIDATION_ERROR', 'Invalid live session id.');
    const bids = await bidModel.listBySession(id, 100);
    success(res, { bids });
}

async function listItemBids(req, res, next) {
    const id = parseId(req.params.itemId);
    if (!id) return failure(res, 'VALIDATION_ERROR', 'Invalid item id.');
    const bids = await bidModel.listByItem(id, 50);
    success(res, { bids });
}

module.exports = { listSessionBids, listItemBids };
