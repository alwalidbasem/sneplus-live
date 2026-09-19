const liveModel = require('../models/live.model');
const { roomFor } = require('../utils/helpers');

// Ephemeral presence: room member counts are kept in memory only.
// Only the peak value is persisted (viewer_peak on live_sessions).
const roomMembers = new Map(); // liveSessionId -> Set(socket.id)

async function broadcastCount(io, liveSessionId) {
    const count = roomMembers.get(liveSessionId) ? roomMembers.get(liveSessionId).size : 0;
    io.to(roomFor(liveSessionId)).emit('viewer:update', { viewers: count });
    if (count > 0) {
        await liveModel.raiseViewerPeak(liveSessionId, count).catch(() => {});
    }
}

function register(io, socket) {
    socket.on('live:join', ({ liveSessionId } = {}) => {
        const id = Number(liveSessionId);
        if (!Number.isInteger(id)) return;
        if (!roomMembers.has(id)) roomMembers.set(id, new Set());
        roomMembers.get(id).add(socket.id);
    });

    socket.on('live:leave', ({ liveSessionId } = {}) => {
        const id = Number(liveSessionId);
        if (roomMembers.has(id)) roomMembers.get(id).delete(socket.id);
    });
}

function handleDisconnect(io, socket) {
    // Collect affected rooms first, then mutate — safe under re-entrancy.
    const affected = [];
    for (const [id, members] of roomMembers.entries()) {
        if (members.delete(socket.id)) affected.push(id);
    }
    for (const id of affected) {
        const members = roomMembers.get(id);
        if (members && members.size === 0) roomMembers.delete(id);
        broadcastCount(io, id).catch(() => {});
    }
    require('./comment.socket').clearRateState(socket.id);
}

module.exports = { register, handleDisconnect, broadcastCount };
