// Integration tests: server-authoritative auction lifecycle over the real
// HTTP + Socket.IO stack against PostgreSQL (dedicated test database).
// Covers: auth on bids, validation, pause/resume of the auction clock,
// concurrent bids, exactly-once finalization, buy-now atomicity, recovery.
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    setup, api, login, socketConnect, socketReady, waitFor, emitAck, USERS
} = require('./helpers.db.js');

const auctionService = require('../src/services/auction.service');
const db = require('../src/config/database');

let base, host, admin, ali, sara, io;

test('setup: boot server, log in all roles', async () => {
    const ctx = await setup();
    base = ctx.base;
    io = ctx.io;
    host = await login(base, USERS.host.email, USERS.host.password);
    admin = await login(base, USERS.admin.email, USERS.admin.password);
    ali = await login(base, USERS.ali.email, USERS.ali.password);
    sara = await login(base, USERS.sara.email, USERS.sara.password);
    assert.ok(host && admin && ali && sara);
});

// --- helpers -------------------------------------------------------------

async function createFastAuctionProduct(title) {
    const res = await api(base, '/api/products', {
        method: 'POST', cookie: admin,
        body: { name: title, category: 'Sneakers', icon: 'ðŸ‘Ÿ', sale_type: 'auction', start_price: 1, bid_duration_seconds: 5 }
    });
    assert.equal(res.status, 201);
    return res.json.data.product;
}

async function createBuyNowProduct(title) {
    const res = await api(base, '/api/products', {
        method: 'POST', cookie: admin,
        body: { name: title, category: 'Phones', icon: 'ðŸ“±', sale_type: 'buy_now', static_price: 99 }
    });
    assert.equal(res.status, 201);
    return res.json.data.product;
}

async function newLiveSession(title) {
    const res = await api(base, '/api/live', { method: 'POST', cookie: host, body: { title } });
    assert.equal(res.status, 201);
    return res.json.data.session.id;
}

async function addItems(sessionId, productIds) {
    const res = await api(base, `/api/live/${sessionId}/items`, {
        method: 'POST', cookie: host, body: { product_ids: productIds }
    });
    assert.equal(res.status, 201);
    return res.json.data.itemIds;
}

async function buyerSocket(cookie) {
    const socket = socketConnect(base, cookie);
    await socketReady(socket);
    return socket;
}

async function startAuction(hostSocket, sessionId, itemId) {
    const startAck = await emitAck(hostSocket, 'admin:live:start', { liveSessionId: sessionId });
    assert.equal(startAck.success, true);
    return emitAck(hostSocket, 'admin:item:start', { liveSessionId: sessionId, liveItemId: itemId });
}

// --- tests ---------------------------------------------------------------

test('bids require authentication and server-side validation', async () => {
    const hostSock = await buyerSocket(host);
    const anon = await buyerSocket(null);

    const product = await createFastAuctionProduct(`AuthGuard ${Date.now()}`);
    const sessionId = await newLiveSession(`AuthGuard live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    const startAck = await startAuction(hostSock, sessionId, itemId);
    assert.equal(startAck.success, true);

    anon.emit('live:join', { liveSessionId: sessionId });
    const anonBid = await emitAck(anon, 'bid:place', { liveItemId: itemId, amount: 5 });
    assert.equal(anonBid.success, false);
    assert.equal(anonBid.error.code, 'UNAUTHENTICATED');

    const aliSock = await buyerSocket(ali);
    aliSock.emit('live:join', { liveSessionId: sessionId });
    const low = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 0 });
    assert.equal(low.success, false);
    assert.equal(low.error.code, 'VALIDATION_ERROR');

    const below = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 1 });
    assert.equal(below.success, false);
    assert.equal(below.error.code, 'TOO_LOW');

    const good = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 5 });
    assert.equal(good.success, true);
    assert.equal(good.data.currentBid, 5);

    anon.disconnect(); aliSock.disconnect(); hostSock.disconnect();
});

test('pause blocks bids; resume restores the auction clock; state stays consistent', async () => {
    const hostSock = await buyerSocket(host);
    const aliSock = await buyerSocket(ali);

    const product = await createFastAuctionProduct(`PauseGuard ${Date.now()}`);
    const sessionId = await newLiveSession(`PauseGuard live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    await startAuction(hostSock, sessionId, itemId);

    aliSock.emit('live:join', { liveSessionId: sessionId });
    const b1 = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 2 });
    assert.equal(b1.success, true);

    const pauseAck = await emitAck(hostSock, 'admin:live:pause', { liveSessionId: sessionId });
    assert.equal(pauseAck.success, true);

    const whilePaused = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 3 });
    assert.equal(whilePaused.success, false);
    assert.equal(whilePaused.error.code, 'LIVE_PAUSED');

    // Pause must freeze the auction clock: the deadline is cleared while paused.
    const pausedState = await api(base, `/api/live/${sessionId}`);
    assert.equal(pausedState.json.data.currentItem.auctionPaused, true);

    const resumeAck = await emitAck(hostSock, 'admin:live:resume', { liveSessionId: sessionId });
    assert.equal(resumeAck.success, true);

    const resumedState = await api(base, `/api/live/${sessionId}`);
    assert.equal(resumedState.json.data.currentItem.auctionPaused, false);
    assert.ok(resumedState.json.data.currentItem.auctionEndsAt);

    const b2 = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 3 });
    assert.equal(b2.success, true);

    aliSock.disconnect(); hostSock.disconnect();
});
test('concurrent bids are serialized; final state is consistent', async () => {
    const hostSock = await buyerSocket(host);
    const product = await createFastAuctionProduct(`RaceGuard ${Date.now()}`);
    const sessionId = await newLiveSession(`RaceGuard live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    await startAuction(hostSock, sessionId, itemId);

    const aliSock = await buyerSocket(ali);
    const saraSock = await buyerSocket(sara);
    aliSock.emit('live:join', { liveSessionId: sessionId });
    saraSock.emit('live:join', { liveSessionId: sessionId });

    const [r1, r2] = await Promise.all([
        emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 10 }),
        emitAck(saraSock, 'bid:place', { liveItemId: itemId, amount: 15 })
    ]);
    assert.equal(r1.success, true);
    assert.equal(r2.success, true);

    const state = await api(base, `/api/live/${sessionId}`);
    assert.equal(state.json.data.currentItem.currentBid, 15);

    aliSock.disconnect(); saraSock.disconnect(); hostSock.disconnect();
});

test('auction expiration happens exactly once; bids after the end are rejected', async () => {
    const hostSock = await buyerSocket(host);
    const product = await createFastAuctionProduct(`OnceGuard ${Date.now()}`);
    const sessionId = await newLiveSession(`OnceGuard live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    await startAuction(hostSock, sessionId, itemId);

    const aliSock = await buyerSocket(ali);
    aliSock.emit('live:join', { liveSessionId: sessionId });

    let endedCount = 0;
    const firstEnd = waitFor(aliSock, 'auction:ended');
    aliSock.on('auction:ended', () => { endedCount += 1; });

    const bid = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 2 });
    assert.equal(bid.success, true);

    await firstEnd;
    await new Promise((r) => setTimeout(r, 500)); // catch any duplicate emission
    assert.equal(endedCount, 1);

    const late = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 9 });
    assert.equal(late.success, false);
    assert.ok(['AUCTION_OVER', 'NOT_ACTIVE'].includes(late.error.code));

    const state = await api(base, `/api/live/${sessionId}`);
    assert.equal(state.json.data.currentItem.status, 'sold');
    assert.equal(state.json.data.currentItem.finalPrice, 2);

    aliSock.disconnect(); hostSock.disconnect();
});

test('buy-now: exactly one order; second purchase is rejected', async () => {
    const hostSock = await buyerSocket(host);
    const product = await createBuyNowProduct(`BuyGuard ${Date.now()}`);
    const sessionId = await newLiveSession(`BuyGuard live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    await startAuction(hostSock, sessionId, itemId);

    const aliSock = await buyerSocket(ali);
    const saraSock = await buyerSocket(sara);
    aliSock.emit('live:join', { liveSessionId: sessionId });
    saraSock.emit('live:join', { liveSessionId: sessionId });

    const buy = await emitAck(aliSock, 'buy-now:purchase', { liveItemId: itemId });
    assert.equal(buy.success, true);
    assert.ok(buy.data.orderId);

    const again = await emitAck(saraSock, 'buy-now:purchase', { liveItemId: itemId });
    assert.equal(again.success, false);
    assert.equal(again.error.code, 'NOT_ACTIVE');

    // Only the buyer owns the order; another user cannot read it.
    const order = await api(base, `/api/orders/${buy.data.orderId}`, { cookie: ali });
    assert.equal(order.status, 200);
    const forbidden = await api(base, `/api/orders/${buy.data.orderId}`, { cookie: sara });
    assert.equal(forbidden.status, 403);

    aliSock.disconnect(); saraSock.disconnect(); hostSock.disconnect();
});

test('concurrent endAuction calls finalize exactly once', async () => {
    const hostSock = await buyerSocket(host);
    const product = await createFastAuctionProduct(`DoubleEnd ${Date.now()}`);
    const sessionId = await newLiveSession(`DoubleEnd live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    await startAuction(hostSock, sessionId, itemId);

    const aliSock = await buyerSocket(ali);
    aliSock.emit('live:join', { liveSessionId: sessionId });

    let endedCount = 0;
    aliSock.on('auction:ended', () => { endedCount += 1; });

    const bid = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 3 });
    assert.equal(bid.success, true);

    // Cancel the scheduled timer, then fire two concurrent finalizations.
    auctionService.cancelAuctionTimer(itemId);
    await Promise.all([
        auctionService.endAuction(io, itemId),
        auctionService.endAuction(io, itemId)
    ]);
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(endedCount, 1);

    const state = await api(base, `/api/live/${sessionId}`);
    assert.equal(state.json.data.currentItem.status, 'sold');

    aliSock.disconnect(); hostSock.disconnect();
});

test('server-restart recovery: expired auctions finalize, live ones reschedule', async () => {
    const hostSock = await buyerSocket(host);
    const product = await createFastAuctionProduct(`Recover ${Date.now()}`);
    const sessionId = await newLiveSession(`Recover live ${Date.now()}`);
    const [itemId] = await addItems(sessionId, [product.id]);
    await startAuction(hostSock, sessionId, itemId);

    const aliSock = await buyerSocket(ali);
    aliSock.emit('live:join', { liveSessionId: sessionId });
    const bid = await emitAck(aliSock, 'bid:place', { liveItemId: itemId, amount: 2 });
    assert.equal(bid.success, true);

    // Simulate a restart: no in-memory timer exists anymore, DB says active
    // with a deadline that already passed.
    auctionService.cancelAuctionTimer(itemId);
    await db.query(
        `UPDATE live_session_items SET auction_ends_at = NOW() - INTERVAL '2 seconds' WHERE id = $1`,
        [itemId]
    );
    await auctionService.recoverActiveAuctions(io);

    const state = await api(base, `/api/live/${sessionId}`);
    assert.equal(state.json.data.currentItem.status, 'sold');
    assert.equal(state.json.data.currentItem.finalPrice, 2);

    aliSock.disconnect(); hostSock.disconnect();
});
