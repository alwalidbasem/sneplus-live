const db = require('../config/database');
const liveModel = require('../models/live.model');
const logger = require('../utils/logger');
const { roomFor } = require('../utils/helpers');
const {
    buildItemPayload, scheduleAuctionEnd, endAuction,
    finalizeActiveItem, cancelAuctionTimer, httpError
} = require('./auction.finalize');

// Starts an item (auction or buy-now) inside a live session.
async function startItem(io, { liveSessionId, liveItemId }) {
    const session = await liveModel.findSessionById(liveSessionId);
    if (!session) throw httpError('SESSION_NOT_FOUND', 'Live session not found.', 404);
    if (session.status !== 'live') throw httpError('LIVE_NOT_ACTIVE', 'The live session is not running.', 400);

    const item = await liveModel.findItemById(liveItemId);
    if (!item || item.live_session_id !== liveSessionId) {
        throw httpError('ITEM_NOT_FOUND', 'Item does not belong to this live session.', 404);
    }
    if (['sold', 'active'].includes(item.status)) {
        throw httpError('ITEM_NOT_AVAILABLE', 'This item cannot be started again.', 400);
    }

    // Finalize whatever item is currently active (auction -> winner/unsold with
    // events + timer cleanup; buy-now -> unsold) so at most one item is active.
    await finalizeActiveItem(io, liveSessionId);

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Safety net: close any other active item as unsold (no-op if none).
        await client.query(
            "UPDATE live_session_items SET status = 'unsold', ended_at = NOW() " +
            "WHERE live_session_id = $1 AND status = 'active' AND id != $2",
            [liveSessionId, liveItemId]
        );
        const isAuction = item.sale_type === 'auction';
        const endsAt = isAuction
            ? new Date(Date.now() + item.bid_duration_seconds * 1000)
            : null;
        await client.query(
            "UPDATE live_session_items SET status = 'active', started_at = NOW(), " +
            'auction_started_at = $2, auction_ends_at = $3 WHERE id = $1',
            [liveItemId, isAuction ? new Date() : null, endsAt]
        );
        await client.query(
            'UPDATE live_sessions SET current_item_id = $1, updated_at = NOW() WHERE id = $2',
            [liveItemId, liveSessionId]
        );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }

    const payload = await buildItemPayload(liveItemId);
    io.to(roomFor(liveSessionId)).emit('item:started', payload);
    logger.info(`Item started: session=${liveSessionId} item=${liveItemId} type=${payload.saleType}`);

    if (payload.saleType === 'auction') {
        scheduleAuctionEnd(io, liveItemId, payload.auctionEndsAt);
    }
    return payload;
}

// Re-export the full auction surface so callers only need this module.
const finalize = require('./auction.finalize');
module.exports = {
    startItem,
    buildItemPayload: finalize.buildItemPayload,
    endAuction: finalize.endAuction,
    buyNow: finalize.buyNow,
    scheduleAuctionEnd: finalize.scheduleAuctionEnd,
    recoverActiveAuctions: finalize.recoverActiveAuctions,
    stopRecoverySweep: finalize.stopRecoverySweep,
    finalizeActiveItem: finalize.finalizeActiveItem,
    cancelAuctionTimer: finalize.cancelAuctionTimer,
    startRecoverySweep: finalize.startRecoverySweep
};
