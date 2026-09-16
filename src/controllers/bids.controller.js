const bidModel = require('../models/bid.model');
const { success } = require('../utils/response');

async function listSessionBids(req, res, next) {
    const bids = await bidModel.listBySession(Number(req.params.liveId), 100);
    success(res, { bids });
}

async function listItemBids(req, res, next) {
    const bids = await bidModel.listByItem(Number(req.params.itemId), 50);
    success(res, { bids });
}

module.exports = { listSessionBids, listItemBids };
