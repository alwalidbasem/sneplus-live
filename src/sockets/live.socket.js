const liveModel = require('../models/live.model');
const liveService = require('../services/live.service');
const auctionService = require('../services/auction.service');
const logger = require('../utils/logger');
const { roomFor } = require('../utils/helpers');
const { socketFail } = require('../utils/response');

function isAdmin(socket) {
    return socket.data.user && ['admin', 'host'].includes(socket.data.user.role);
}

// live:join is public (watching); admin:* commands require admin/host role and
// re-derive every authoritative value from PostgreSQL.
function register(io, socket) {
    socket.on('live:join', async ({ liveSessionId } = {}) => {
        const id = Number(liveSessionId);
        if (!Number.isInteger(id)) return;
        socket.join(roomFor(id));
        const state = await liveService.getLiveState(id);
        socket.emit('live:state', state);
        require('./viewer.socket').broadcastCount(io, id);
    });

    socket.on('live:leave', ({ liveSessionId } = {}) => {
        const id = Number(liveSessionId);
        if (!Number.isInteger(id)) return;
        socket.leave(roomFor(id));
        require('./viewer.socket').broadcastCount(io, id);
    });

    socket.on('admin:live:start', async ({ liveSessionId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            const state = await liveService.startLive(io, { liveSessionId: Number(liveSessionId) });
            ack && ack({ success: true, data: state });
        } catch (err) {
            ack && ack(socketFail(err.code || 'LIVE_START_FAILED', err.message));
        }
    });

    socket.on('admin:live:pause', async ({ liveSessionId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            await liveService.pauseLive(io, { liveSessionId: Number(liveSessionId) });
            ack && ack({ success: true });
        } catch (err) {
            logger.error('Pause live failed:', err.message);
            ack && ack(socketFail(err.code || 'LIVE_PAUSE_FAILED', err.message));
        }
    });

    socket.on('admin:live:resume', async ({ liveSessionId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            await liveService.resumeLive(io, { liveSessionId: Number(liveSessionId) });
            ack && ack({ success: true });
        } catch (err) {
            logger.error('Resume live failed:', err.message);
            ack && ack(socketFail(err.code || 'LIVE_RESUME_FAILED', err.message));
        }
    });

    socket.on('admin:live:end', async ({ liveSessionId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            const state = await liveService.endLive(io, { liveSessionId: Number(liveSessionId) });
            ack && ack({ success: true, data: state });
        } catch (err) {
            logger.error('End live failed:', err.message);
            ack && ack(socketFail(err.code || 'LIVE_END_FAILED', err.message));
        }
    });

    socket.on('admin:item:start', async ({ liveSessionId, liveItemId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            const payload = await auctionService.startItem(io, {
                liveSessionId: Number(liveSessionId),
                liveItemId: Number(liveItemId)
            });
            ack && ack({ success: true, data: payload });
        } catch (err) {
            ack && ack(socketFail(err.code || 'ITEM_START_FAILED', err.message));
        }
    });

    socket.on('admin:item:end', async ({ liveItemId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            const payload = await auctionService.endAuction(io, Number(liveItemId));
            ack && ack({ success: true, data: payload });
        } catch (err) {
            logger.error('End item failed:', err.message);
            ack && ack(socketFail(err.code || 'ITEM_END_FAILED', err.message));
        }
    });

    socket.on('admin:item:switch', async ({ liveSessionId, liveItemId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            // startItem finalizes whatever is currently active (exactly once,
            // with events) then starts the new item — no double item:ended.
            const payload = await auctionService.startItem(io, {
                liveSessionId: Number(liveSessionId),
                liveItemId: Number(liveItemId)
            });
            ack && ack({ success: true, data: payload });
        } catch (err) {
            ack && ack(socketFail(err.code || 'ITEM_SWITCH_FAILED', err.message));
        }
    });

    socket.on('admin:item:restart', async ({ liveSessionId, liveItemId } = {}, ack) => {
        if (!isAdmin(socket)) return ack && ack(socketFail('FORBIDDEN', 'Admin access required.'));
        try {
            // Re-open an unsold item: reset it to pending, then start it fresh.
            const id = Number(liveItemId);
            const item = await liveModel.findItemById(id);
            if (!item || item.status !== 'unsold') {
                return ack && ack(socketFail('ITEM_NOT_RESTARTABLE', 'Only unsold items can be restarted.'));
            }
            await require('../config/database').query(
                `UPDATE live_session_items
                 SET status = 'pending', auction_started_at = NULL, auction_ends_at = NULL,
                     winning_bid_id = NULL, winner_user_id = NULL, final_price = NULL, ended_at = NULL
                 WHERE id = $1`,
                [id]
            );
            const payload = await auctionService.startItem(io, {
                liveSessionId: Number(liveSessionId),
                liveItemId: id
            });
            ack && ack({ success: true, data: payload });
        } catch (err) {
            ack && ack(socketFail(err.code || 'ITEM_RESTART_FAILED', err.message));
        }
    });
}

module.exports = { register };
