const bidService = require('../services/bid.service');
const { socketFail } = require('../utils/response');

// Bidding is only accepted from authenticated sockets. The user identity comes
// from the server-side session — never from the client payload.
function register(io, socket) {
    socket.on('bid:place', async ({ liveItemId, amount } = {}, ack) => {
        const user = socket.data.user;
        if (!user) {
            const fail = socketFail('UNAUTHENTICATED', 'You must be logged in to bid.');
            socket.emit('bid:rejected', fail.error);
            return ack && ack(fail);
        }
        const id = Number(liveItemId);
        const value = Number(amount);
        if (!Number.isInteger(id) || !Number.isFinite(value) || value <= 0) {
            const fail = socketFail('VALIDATION_ERROR', 'Invalid bid.');
            socket.emit('bid:rejected', fail.error);
            return ack && ack(fail);
        }
        try {
            const payload = await bidService.placeBid(io, {
                userId: user.id,
                displayName: user.name,
                liveItemId: id,
                amount: value
            });
            ack && ack({ success: true, data: payload });
        } catch (err) {
            const fail = socketFail(err.code || 'BID_FAILED', err.message);
            socket.emit('bid:rejected', fail.error);
            ack && ack(fail);
        }
    });

    socket.on('buy-now:purchase', async ({ liveItemId } = {}, ack) => {
        const user = socket.data.user;
        if (!user) {
            const fail = socketFail('UNAUTHENTICATED', 'You must be logged in to buy.');
            socket.emit('bid:rejected', fail.error);
            return ack && ack(fail);
        }
        const id = Number(liveItemId);
        if (!Number.isInteger(id)) {
            return ack && ack(socketFail('VALIDATION_ERROR', 'Invalid item.'));
        }
        try {
            const auctionService = require('../services/auction.service');
            const payload = await auctionService.buyNow(io, {
                userId: user.id,
                displayName: user.name,
                liveItemId: id
            });
            ack && ack({ success: true, data: payload });
        } catch (err) {
            const fail = socketFail(err.code || 'BUY_NOW_FAILED', err.message);
            socket.emit('bid:rejected', fail.error);
            ack && ack(fail);
        }
    });
}

module.exports = { register };
