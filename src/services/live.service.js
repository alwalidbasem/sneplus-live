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
    await require('../models/live.model').updateSession(liveSessionId, { status: 'paused' });
    logger.info(`Live paused: session=${liveSessionId}`);
    io.to(roomFor(liveSessionId)).emit('live:paused', { liveSessionId });
    return getLiveState(liveSessionId);
}

async function resumeLive(io, { liveSessionId }) {
    await require('../models/live.model').updateSession(liveSessionId, { status: 'live' });
    logger.info(`Live resumed: session=${liveSessionId}`);
    io.to(roomFor(liveSessionId)).emit('live:resumed', { liveSessionId });
    return getLiveState(liveSessionId);
}

async function endLive(io, { liveSessionId }) {
    // End any still-active item first (as unsold) so nothing is left dangling.
    const active = await liveModel.findActiveItem(liveSessionId);
    if (active) {
        if (active.sale_type === 'auction') {
            await auctionService.endAuction(io, active.id).catch(() => {});
        } else {
            await liveModel.updateSession(liveSessionId, {});
        }
        await require('../config/database').query(
            `UPDATE live_session_items SET status = 'unsold', ended_at = NOW()
             WHERE id = $1 AND status = 'active'`,
            [active.id]
        );
    }
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
