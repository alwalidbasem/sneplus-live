
const db = require('../config/database');
const liveModel = require('../models/live.model');
const bidModel = require('../models/bid.model');
const logger = require('../utils/logger');
const { roomFor } = require('../utils/helpers');

// In-memory timers for auction finalization. Persistent state (deadline,
// status, bids) lives in PostgreSQL; these timers are rebuilt on startup.
const timers = new Map(); // liveItemId -> timeout handle

function httpError(code, message, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

// Full authoritative snapshot of one live item (product info + bid state).
async function buildItemPayload(liveItemId) {
    const item = await liveModel.findItemById(liveItemId);
    if (!item) return null;
    const highest = await bidModel.findHighestBid(liveItemId);
    return {
        id: item.id,
        liveSessionId: item.live_session_id,
        productId: item.product_id,
        name: item.name,
        category: item.category,
        icon: item.icon,
        imageUrl: item.image_url,
        description: item.description,
        saleType: item.sale_type,
        status: item.status,
        startPrice: item.start_price !== null ? Number(item.start_price) : null,
        staticPrice: item.static_price !== null ? Number(item.static_price) : null,
        bidDurationSeconds: item.bid_duration_seconds,
        auctionStartedAt: item.auction_started_at,
        auctionEndsAt: item.auction_ends_at,
        auctionPaused: item.auction_paused_remaining_ms != null,
        auctionRemainingMs: item.auction_paused_remaining_ms != null ? Number(item.auction_paused_remaining_ms) : null,
        finalPrice: item.final_price !== null ? Number(item.final_price) : null,
        winnerUserId: item.winner_user_id,
        currentBid: highest ? Number(highest.amount) : (item.start_price !== null ? Number(item.start_price) : null),
        highestBidder: highest ? highest.bidder_name : null
    };
}

function scheduleAuctionEnd(io, liveItemId, endsAt) {
    if (timers.has(liveItemId)) clearTimeout(timers.get(liveItemId));
    const delay = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const handle = setTimeout(() => {
        timers.delete(liveItemId);
        endAuction(io, liveItemId).catch((err) =>
            logger.error(`Auction finalization failed for item ${liveItemId}:`, err.message)
        );
    }, delay + 250); // small grace so a bid exactly at the deadline can win
    timers.set(liveItemId, handle);
}

// Cancels a scheduled finalization (used when a live session is paused).
function cancelAuctionTimer(liveItemId) {
    const handle = timers.get(liveItemId);
    if (handle) {
        clearTimeout(handle);
        timers.delete(liveItemId);
    }
}

// Prevents duplicate concurrent finalization work/emits for the same item.
// The PostgreSQL row lock inside endAuction already guarantees an exactly-once
// state transition; this guard also stops duplicate event bursts.
const finalizing = new Set();

// Finalizes an auction: winner = highest bid, or unsold if no bids.


async function endAuction(io, liveItemId) {
    if (finalizing.has(liveItemId)) return null;
    finalizing.add(liveItemId);
    try {
    const client = await db.connect();
    let result;
    try {
        await client.query('BEGIN');
        const itemResult = await client.query(
            `SELECT * FROM live_session_items WHERE id = $1 FOR UPDATE`,
            [liveItemId]
        );
        const item = itemResult.rows[0];
        if (!item || item.status !== 'active') {
            await client.query('ROLLBACK');
            return null; // already ended
        }
        const highest = await bidModel.findHighestBid(liveItemId);
        if (highest) {
            await client.query(
                `UPDATE live_session_items
                 SET status = 'sold', ended_at = NOW(),
                     winning_bid_id = $2, winner_user_id = $3, final_price = $4
                 WHERE id = $1`,
                [liveItemId, highest.id, highest.user_id, highest.amount]
            );
        } else {
            await client.query(
                `UPDATE live_session_items SET status = 'unsold', ended_at = NOW() WHERE id = $1`,
                [liveItemId]
            );
        }
        await client.query('COMMIT');
        result = { item, highest };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }

    const { item, highest } = result;
    const payload = await buildItemPayload(liveItemId);
    const room = roomFor(item.live_session_id);

    io.to(room).emit('auction:ended', {
        liveItemId,
        finalPrice: payload.finalPrice,
        highestBidder: payload.highestBidder
    });
    if (highest) {
        io.to(room).emit('product:sold', { liveItemId, finalPrice: payload.finalPrice });
        io.to(room).emit('winner:selected', {
            liveItemId,
            winnerUserId: payload.winnerUserId,
            winnerName: payload.highestBidder,
            finalPrice: payload.finalPrice
        });
        logger.info(`Auction ended (sold): item=${liveItemId} winner=${payload.highestBidder} price=${payload.finalPrice}`);
    } else {
        io.to(room).emit('product:unsold', { liveItemId });
        logger.info(`Auction ended (unsold): item=${liveItemId}`);
    }
    io.to(room).emit('item:ended', payload);
    return payload;
    } finally {
        finalizing.delete(liveItemId);
    }
}

// Buy Now: transaction + row lock guarantees exactly one winner.
async function buyNow(io, { userId, displayName, liveItemId }) {
    const client = await db.connect();
    let outcome;
    try {
        await client.query('BEGIN');
        const itemResult = await client.query(
            `SELECT * FROM live_session_items WHERE id = $1 FOR UPDATE`,
            [liveItemId]
        );
        const item = itemResult.rows[0];
        if (!item) throw httpError('NOT_FOUND', 'This item is not available.', 404);
        if (item.status !== 'active') {
            throw httpError('NOT_ACTIVE', 'This item is no longer available.', 400);
        }
        const productResult = await client.query(
            'SELECT sale_type FROM products WHERE id = $1',
            [item.product_id]
        );
        if (productResult.rows[0]?.sale_type !== 'buy_now') {
            throw httpError('NOT_BUY_NOW', 'This item is sold via auction only.', 400);
        }

        const price = Number(item.static_price);
        await client.query(
            `UPDATE live_session_items
             SET status = 'sold', ended_at = NOW(), winner_user_id = $2, final_price = $3
             WHERE id = $1`,
            [liveItemId, userId, price]
        );
        const order = await require('./order.service').createBuyNowOrder(client, {
            userId,
            liveSessionId: item.live_session_id,
            productId: item.product_id,
            liveItemId,
            unitPrice: price
        });
        await client.query('COMMIT');
        outcome = { item, price, orderId: order.id };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (err.code && ['NOT_FOUND', 'NOT_ACTIVE', 'NOT_BUY_NOW'].includes(err.code)) {
            logger.warn(`Buy Now rejected: item=${liveItemId} user=${userId} code=${err.code}`);
            throw err;
        }
        logger.error('Buy Now transaction failure:', err.message);
        throw httpError('BUY_NOW_FAILED', 'Could not complete the purchase. Please try again.', 500);
    } finally {
        client.release();
    }

    const payload = await buildItemPayload(liveItemId);
    io.to(roomFor(outcome.item.live_session_id)).emit('buy-now:sold', {
        liveItemId,
        winnerUserId: userId,
        winnerName: displayName,
        price: outcome.price,
        orderId: outcome.orderId
    });
    io.to(roomFor(outcome.item.live_session_id)).emit('item:ended', payload);
    logger.info(`Buy Now sold: item=${liveItemId} user=${userId} price=${outcome.price}`);
    return { ...payload, orderId: outcome.orderId, price: outcome.price };
}

// Ensures at most one active item per session: finalizes the currently active
// item (auction -> winner/unsold with full events; buy-now -> unsold) before a
// new item starts or the session ends. Returns the finalized payload or null.
async function finalizeActiveItem(io, liveSessionId) {
    const active = await liveModel.findActiveItem(liveSessionId);
    if (!active) return null;
    if (active.sale_type === 'auction') {
        return endAuction(io, active.id); // full finalize + events + timer cleanup
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const check = await client.query(
            `SELECT id FROM live_session_items WHERE id = $1 AND status = 'active' FOR UPDATE`,
            [active.id]
        );
        if (check.rows[0]) {
            await client.query(
                `UPDATE live_session_items SET status = 'unsold', ended_at = NOW() WHERE id = $1`,
                [active.id]
            );
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
    const payload = await buildItemPayload(active.id);
    io.to(roomFor(liveSessionId)).emit('item:ended', payload);
    logger.info(`Buy-now item closed (unsold): item=${active.id}`);
    return payload;
}

// Startup recovery: finalize expired auctions, reschedule live ones.
async function recoverActiveAuctions(io) {
    const result = await db.query(
        `SELECT i.id, i.auction_ends_at, i.auction_paused_remaining_ms, p.sale_type
         FROM live_session_items i JOIN products p ON p.id = i.product_id
         WHERE i.status = 'active'`
    );
    for (const item of result.rows) {
        if (item.sale_type !== 'auction') continue; // buy-now items stay purchasable
        // Auction paused before a restart: its clock resumes on live:resume.
        if (!item.auction_ends_at && item.auction_paused_remaining_ms != null) continue;
        if (item.auction_ends_at && new Date(item.auction_ends_at).getTime() <= Date.now()) {
            logger.info(`Recovery: finalizing expired auction item=${item.id}`);
            await endAuction(io, item.id).catch((err) =>
                logger.error(`Recovery finalize failed for item ${item.id}:`, err.message)
            );
        } else if (item.auction_ends_at) {
            logger.info(`Recovery: rescheduling auction item=${item.id}`);
            scheduleAuctionEnd(io, item.id, item.auction_ends_at);
        } else {
            // Corrupt state: active auction with no deadline and no pause marker.
            logger.warn(`Recovery: auction item=${item.id} has no deadline; finalizing as unsold`);
            await endAuction(io, item.id).catch(() => {});
        }
    }
}

// Periodic safety net: re-finalizes anything a failed timer left behind and
// re-arms timers after transient errors. Cheap (one indexed query).
let sweepTimer = null;
function startRecoverySweep(io, intervalMs = 30000) {
    if (sweepTimer) return sweepTimer;
    sweepTimer = setInterval(() => {
        recoverActiveAuctions(io).catch((err) =>
            logger.error('Recovery sweep failed:', err.message)
        );
    }, intervalMs);
    if (sweepTimer.unref) sweepTimer.unref();
    return sweepTimer;
}

function stopRecoverySweep() {
    if (sweepTimer) {
        clearInterval(sweepTimer);
        sweepTimer = null;
    }
}

module.exports = {
    buildItemPayload,
    scheduleAuctionEnd,
    cancelAuctionTimer,
    endAuction,
    finalizeActiveItem,
    buyNow,
    recoverActiveAuctions,
    startRecoverySweep,
    stopRecoverySweep
};
