// Integration tests: authentication, authorization, waitlist, admin.
// Requires a reachable PostgreSQL instance (see .env.test.example);
// configuration is read from .env / environment, DB_NAME is overridden
// to a dedicated test database by tests/helpers.db.js.
const test = require('node:test');
const assert = require('node:assert/strict');

const { setup, api, login, USERS } = require('./helpers.db.js');

let base;

test('setup: migrate + seed + boot server', async () => {
    ({ base } = await setup());
    assert.ok(base.startsWith('http://127.0.0.1:'));
});

test('register creates a buyer — role cannot be escalated via the request body', async () => {
    const email = `esc+${Date.now()}@test.local`;
    const res = await api(base, '/api/auth/register', {
        method: 'POST',
        body: { name: 'Escalator', email, password: 'Password123!', role: 'admin' }
    });
    assert.equal(res.status, 201);
    assert.equal(res.json.data.user.role, 'buyer');
});

test('register rejects duplicate email and invalid input', async () => {
    const dup = await api(base, '/api/auth/register', {
        method: 'POST',
        body: { name: 'Ali H.', email: USERS.ali.email, password: 'Password123!' }
    });
    assert.equal(dup.status, 409);

    const bad = await api(base, '/api/auth/register', {
        method: 'POST',
        body: { name: 'X', email: 'not-an-email', password: 'short' }
    });
    assert.equal(bad.status, 400);
});

test('login returns a session cookie; /me reflects it; bad password is 401', async () => {
    const bad = await api(base, '/api/auth/login', {
        method: 'POST',
        body: { email: USERS.admin.email, password: 'wrong-password' }
    });
    assert.equal(bad.status, 401);

    const cookie = await login(base, USERS.admin.email, USERS.admin.password);
    assert.match(cookie, /connect\.sid=/);

    const me = await api(base, '/api/auth/me', { cookie });
    assert.equal(me.status, 200);
    assert.equal(me.json.data.user.role, 'admin');
});

test('logout destroys the server-side session', async () => {
    const cookie = await login(base, USERS.ali.email, USERS.ali.password);
    const out = await api(base, '/api/auth/logout', { method: 'POST', cookie });
    assert.equal(out.status, 200);
    const me = await api(base, '/api/auth/me', { cookie });
    assert.equal(me.json.data.user, null);
});

test('anonymous /me has no user', async () => {
    const me = await api(base, '/api/auth/me');
    assert.equal(me.json.data.user, null);
});

test('waitlist: join, duplicate (including case-variant), admin-only listing', async () => {
    const email = `wl+${Date.now()}@test.local`;
    const join = await api(base, '/api/waitlist', {
        method: 'POST',
        body: { name: 'Test User', email, country: 'Jordan', user_type: 'buyer', category: 'Sneakers', language: 'en' }
    });
    assert.equal(join.status, 201);

    const dup = await api(base, '/api/waitlist', {
        method: 'POST',
        body: { name: 'Test User', email, country: 'Jordan', user_type: 'buyer', category: 'Sneakers', language: 'en' }
    });
    assert.equal(dup.status, 409);

    const upper = await api(base, '/api/waitlist', {
        method: 'POST',
        body: { name: 'Test User', email: email.toUpperCase(), country: 'Jordan', user_type: 'seller', category: 'Watches', language: 'en' }
    });
    assert.equal(upper.status, 409);

    const buyerCookie = await login(base, USERS.ali.email, USERS.ali.password);
    const forbidden = await api(base, '/api/waitlist', { cookie: buyerCookie });
    assert.equal(forbidden.status, 403);

    const adminCookie = await login(base, USERS.admin.email, USERS.admin.password);
    const ok = await api(base, '/api/waitlist', { cookie: adminCookie });
    assert.equal(ok.status, 200);
    assert.ok(Array.isArray(ok.json.data.entries));
});

test('admin dashboard is admin/host only; orders are scoped to their owner', async () => {
    const buyerCookie = await login(base, USERS.ali.email, USERS.ali.password);
    const forbidden = await api(base, '/api/admin/dashboard', { cookie: buyerCookie });
    assert.equal(forbidden.status, 403);

    const adminCookie = await login(base, USERS.admin.email, USERS.admin.password);
    const ok = await api(base, '/api/admin/dashboard', { cookie: adminCookie });
    assert.equal(ok.status, 200);
    assert.ok('total_revenue' in ok.json.data.stats);

    const orders = await api(base, '/api/orders', { cookie: buyerCookie });
    assert.equal(orders.status, 200);
    assert.ok(Array.isArray(orders.json.data.orders));

    const other = await api(base, '/api/orders/999999', { cookie: buyerCookie });
    assert.equal(other.status, 404);

    const badId = await api(base, '/api/orders/not-a-number', { cookie: buyerCookie });
    assert.ok(badId.status === 400 || badId.status === 404);
});