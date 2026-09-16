const db = require('../config/database');
const orderModel = require('../models/order.model');
const logger = require('../utils/logger');

// Creates a Buy Now order. Must be called INSIDE the same transaction that
// marks the live item as sold, so the order only exists if the win is real.
async function createBuyNowOrder(client, { userId, liveSessionId, productId, liveItemId, unitPrice }) {
    const order = await orderModel.createWithItem(client, {
        userId,
        liveSessionId,
        productId,
        liveItemId,
        unitPrice
    });
    logger.info(`Order created: order=${order.id} user=${userId} item=${liveItemId} price=${unitPrice}`);
    return order;
}

module.exports = { createBuyNowOrder };
