const db = require('../config/database');
const liveModel = require('../models/live.model');
const bidModel = require('../models/bid.model');
const commentModel = require('../models/comment.model');
const auctionService = require('./auction.service');
const logger = require('../utils/logger');
const { roomFor } = require('../utils/helpers');

// Full authoritative snapshot of a live session. Sent on join, after admin
// actions, and used to rebuild client UI after reconnects / server restarts.
async function getLiveState(liveSessionId) {
    const session = await liveModel.findSessionById(liveSessionId);
    if (!session) return null;
    const items = await liveModel.findItemsBySession(liveSessionId);
    const current = session.current_item_id
        ? await auctionService.buildItemPayload(session.current_item_id)
        : null;
    const unsold = items.filter((i) => i.status === 'unsold');
    return {
        session: {
            id: session.id,
            title: session.title,
            status: session.status,
            hostName: session.host_name,
            startedAt: session.started_at,
            viewerPeak: session.viewer_peak
        },
        items: items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            icon: i.icon,
            imageUrl: i.image_url,
            saleType: i.sale_type,
            status: i.status,
            position: i.position,
            startPrice: i.start_price !== null ? Number(i.start_price) : null,
            staticPrice: i.static_price !== null ? Number(i.static_price) : null,
            bidDurationSeconds: i.bid_duration_seconds
        })),
        currentItem: current,
        unsoldCount: unsold.length
    };
}

async function startLive(io, { liveSessionId }) {
    const session = await liveModel.findSessionById(liveSessionId);
    if (!session) throw httpError('SESSION_NOT_FOUND', 'Live session not found.', 404);
    if (session.status === 'live') return getLiveState(liveSessionId);
    if (session.status === 'ended') throw httpError('SESSION_ENDED', 'This live session has already ended.', 400);

    await liveModel.updateSession(liveSessionId, {
        status: 'live',
        started_at: session.started_at || new Date()
    });
    logger.info(`Live started: session=${liveSessionId}`);
    const state = await getLiveState(liveSessionId);
    io.to(roomFor(liveSessionId)).emit('live:started', state);
    return state;
}

async function pauseLive(io, { liveSessionId }) {
    const session = await liveModel.findSessionById(liveSessionId);
    if (!session) throw httpError('SESSION_NOT_FOUND', 'Live session not found.', 404);
    if (session.status === 'ended') throw httpError('SESSION_ENDED', 'This live session has already ended.', 400);
    if (session.status === 'paused') return getLiveState(liveSessionId);

    // Freeze the running auction clock: persist the remaining time and clear
    // the deadline + timer, so a paused live really pauses.
    const active = await liveModel.findActiveItem(liveSessionId);
    if (active && active.sale_type === 'auction' && active.auction_ends_at) {
        const remainingMs = Math.max(0, new Date(active.auction_ends_at).getTime() - Date.now());
        await db.query(
            'UPDATE live_session_items SET auction_ends_at = NULL, auction_paused_remaining_ms = $2 WHERE id = $1',
            [active.id, Math.ceil(remainingMs)]
        );
        auctionService.cancelAuctionTimer(active.id);
        io.to(roomFor(liveSessionId)).emit('item:paused', { liveItemId: active.id, remainingMs });
    }
    await liveModel.updateSession(liveSessionId, { status: 'paused' });
    logger.info(`Live paused: session=${liveSessionId}`);
    io.to(roomFor(liveSessionId)).emit('live:paused', { liveSessionId });
    return getLiveState(liveSessionId);
}

async function resumeLive(io, { liveSessionId }) {
    const session = await liveModel.findSessionById(liveSessionId);
    if (!session) throw httpError('SESSION_NOT_FOUND', 'Live session not found.', 404);
    if (session.status === 'ended') throw httpError('SESSION_ENDED', 'This live session has already ended.', 400);
    if (session.status === 'live') return getLiveState(liveSessionId);

    // Unfreeze a paused auction: restore its deadline and timer from the
    // remaining time captured at pause.
    const active = await liveModel.findActiveItem(liveSessionId);
    if (active && active.sale_type === 'auction' && active.auction_paused_remaining_ms != null) {
        const endsAt = new Date(Date.now() + Number(active.auction_paused_remaining_ms));
        await db.query(
            'UPDATE live_session_items SET auction_ends_at = $2, auction_paused_remaining_ms = NULL WHERE id = $1',
            [active.id, endsAt]
        );
        auctionService.scheduleAuctionEnd(io, active.id, endsAt);
        io.to(roomFor(liveSessionId)).emit('item:resumed', { liveItemId: active.id, auctionEndsAt: endsAt });
    }
    await liveModel.updateSession(liveSessionId, { status: 'live' });
    logger.info(`Live resumed: session=${liveSessionId}`);
    io.to(roomFor(liveSessionId)).emit('live:resumed', { liveSessionId });
    return getLiveState(liveSessionId);
}

async function endLive(io, { liveSessionId }) {
    const session = await liveModel.findSessionById(liveSessionId);
    if (!session) throw httpError('SESSION_NOT_FOUND', 'Live session not found.', 404);
    if (session.status === 'ended') return getLiveState(liveSessionId);
    // Finalize whatever item is active (auction -> winner/unsold with events;
    // buy-now -> unsold) so nothing is left dangling with a live timer.
    await auctionService.finalizeActiveItem(io, liveSessionId);
    await liveModel.updateSession(liveSessionId, { status: 'ended', ended_at: new Date(), current_item_id: null });
    logger.info(`Live ended: session=${liveSessionId}`);
    io.to(roomFor(liveSessionId)).emit('live:ended', { liveSessionId });
    return getLiveState(liveSessionId);
}

async function getRecentComments(liveSessionId) {
    return commentModel.listBySession(liveSessionId, 30);
}

function httpError(code, message, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

module.exports = {
    getLiveState,
    startLive,
    pauseLive,
    resumeLive,
    endLive,
    getRecentComments
};
