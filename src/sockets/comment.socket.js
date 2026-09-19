const commentModel = require('../models/comment.model');
const logger = require('../utils/logger');
const { roomFor } = require('../utils/helpers');
const { sanitizeText } = require('../utils/validators');
const { socketFail } = require('../utils/response');

const MAX_COMMENT_LENGTH = 300;
const lastCommentAt = new Map(); // socket.id -> ts (lightweight comment flood guard)

function register(io, socket) {
    socket.on('comment:send', async ({ liveSessionId, message } = {}) => {
        const user = socket.data.user;
        if (!user) {
            socket.emit('comment:rejected', socketFail('UNAUTHENTICATED', 'You must be logged in to comment.').error);
            return;
        }
        const id = Number(liveSessionId);
        const text = sanitizeText(message).slice(0, MAX_COMMENT_LENGTH);
        if (!Number.isInteger(id) || !text) return;

        const now = Date.now();
        const last = lastCommentAt.get(socket.id) || 0;
        if (now - last < 1500) {
            socket.emit('comment:rejected', socketFail('RATE_LIMITED', 'You are commenting too fast.').error);
            return;
        }
        lastCommentAt.set(socket.id, now);

        try {
            const comment = await commentModel.create({
                liveSessionId: id,
                userId: user.id,
                displayName: user.name,
                message: text
            });
            io.to(roomFor(id)).emit('comment:new', {
                id: comment.id,
                userId: user.id,
                displayName: user.name,
                message: comment.message,
                createdAt: comment.created_at
            });
        } catch (err) {
            logger.error('Comment create failed:', err.message);
            socket.emit('comment:rejected', socketFail('COMMENT_FAILED', 'Could not send your comment.').error);
        }
    });

    // Hearts/reactions are ephemeral — never stored in PostgreSQL.
    socket.on('reaction:send', ({ liveSessionId, type } = {}) => {
        const id = Number(liveSessionId);
        if (!Number.isInteger(id)) return;
        if (type !== 'heart') return;
        io.to(roomFor(id)).emit('reaction:new', { type: 'heart', from: socket.id });
    });
}

function clearRateState(socketId) {
    lastCommentAt.delete(socketId);
}

module.exports = { register, clearRateState };
