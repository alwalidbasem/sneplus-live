const db = require('../config/database');
const bidModel = require('../models/bid.model');
const logger = require('../utils/logger');
const { roomFor } = require('../utils/helpers');

const BID_REJECTION = {
    NOT_FOUND: 'This item is not part of an active live.',
    NOT_ACTIVE: 'Bidding is not open for this item.',
    NOT_AUCTION: 'This item is not an auction.',
    AUCTION_OVER: 'The auction for this item has ended.',
    LIVE_PAUSED: 'The live is paused right now — bidding is temporarily closed.',
    VALID_AMOUNT: 'Enter a valid bid amount.',
    TOO_LOW: 'Your bid must be higher than the current bid.'
};

function rejection(code) {
    const error = new Error(BID_REJECTION[code]);
    error.code = code;
    error.status = 400;
    return error;
}

// Server-authoritative bid placement. Everything is validated inside a
// transaction with the item row locked so two simultaneous bids cannot race.
async function placeBid(io, { userId, displayName, liveItemId, amount }) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 9999999999) throw rejection('VALID_AMOUNT');

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const itemResult = await client.query(
            `SELECT * FROM live_session_items WHERE id = $1 FOR UPDATE`,
            [liveItemId]
        );
        const item = itemResult.rows[0];
        if (!item) throw rejection('NOT_FOUND');
        if (item.status !== 'active') throw rejection('NOT_ACTIVE');

        // The parent live session must be actively running. Locking the session
        // row serializes bids against concurrent pause/resume/end operations.
        const sessionResult = await client.query(
            'SELECT status FROM live_sessions WHERE id = $1 FOR SHARE',
            [item.live_session_id]
        );
        const sessionStatus = sessionResult.rows[0] && sessionResult.rows[0].status;
        if (!sessionStatus) throw rejection('NOT_FOUND');
        if (sessionStatus === 'paused') throw rejection('LIVE_PAUSED');
        if (sessionStatus !== 'live') throw rejection('NOT_ACTIVE');

        const productResult = await client.query(
            'SELECT sale_type FROM products WHERE id = $1',
            [item.product_id]
        );
        if (productResult.rows[0]?.sale_type !== 'auction') throw rejection('NOT_AUCTION');
        if (item.auction_ends_at && new Date(item.auction_ends_at).getTime() <= Date.now()) {
            throw rejection('AUCTION_OVER');
        }

        const highest = await bidModel.findHighestBid(liveItemId);
        const currentPrice = highest ? Number(highest.amount) : Number(item.start_price);
        if (!(value > currentPrice)) throw rejection('TOO_LOW');

        const bid = await bidModel.createBid(client, {
            liveSessionId: item.live_session_id,
            liveItemId,
            userId,
            amount: value
        });

        await client.query('COMMIT');

        const payload = {
            liveItemId,
            bidId: bid.id,
            currentBid: Number(amount),
            highestBidder: displayName,
            createdAt: bid.created_at
        };
        io.to(roomFor(item.live_session_id)).emit('bid:new', payload);
        logger.info(`Bid accepted: item=${liveItemId} user=${userId} amount=${amount}`);
        return payload;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        if (err.code && BID_REJECTION[err.code]) {
            logger.warn(`Bid rejected: item=${liveItemId} user=${userId} code=${err.code}`);
        }
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { placeBid, BID_REJECTION };
