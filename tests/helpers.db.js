// Shared PostgreSQL/HTTP/Socket.IO test helpers.
// Creates a dedicated test database (DB_NAME + "_test", or TEST_DB_NAME),
// runs migrations + demo seed, and boots the app on an ephemeral port.
// Idempotent: safe to require from every test file (each runs in its own
// process under `node --test`).
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || `${process.env.DB_NAME || 'sneplus_live'}_test`;

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
};

let readyPromise = null;

function setup() {
    if (!readyPromise) readyPromise = doSetup();
    return readyPromise;
}

async function doSetup() {
    const { Pool } = require('pg');
    const adminPool = new Pool({ ...dbConfig, database: 'postgres' });
    const dbName = process.env.DB_NAME;
    const exists = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
        await adminPool.query(`CREATE DATABASE "${dbName}"`);
    }
    await adminPool.end();

    // These binds the shared pool to the test database (env was overridden above).
    const migrate = require('../src/database/migrate'); // module IS the function
    await migrate();
    const seed = require('../src/database/seed'); // module IS the function
    await seed('demo.sql');

    const { server, io } = require('../server');
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    return { server, io, port, base: `http://127.0.0.1:${port}` };
}

// Minimal fetch wrapper with cookie capture/passthrough (session auth).
async function api(base, path, { method = 'GET', body, cookie } = {}) {
    const res = await fetch(base + path, {
        method,
        headers: {
            'content-type': 'application/json',
            ...(cookie ? { cookie } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const raw = res.headers.get('set-cookie');
    const cookieValue = raw ? raw.split(';')[0] : null;
    let json = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, json, cookie: cookieValue };
}

async function login(base, email, password) {
    const res = await api(base, '/api/auth/login', { method: 'POST', body: { email, password } });
    if (res.status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.json)}`);
    return res.cookie;
}

function socketConnect(base, cookie) {
    const { io: Client } = require('socket.io-client');
    return Client(base, {
        transports: ['websocket'],
        extraHeaders: cookie ? { cookie } : {},
        reconnection: false
    });
}

function socketReady(socket, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        if (socket.connected) return resolve();
        const timer = setTimeout(() => reject(new Error('socket connect timeout')), timeoutMs);
        socket.once('connect', () => { clearTimeout(timer); resolve(); });
    });
}

function waitFor(socket, event, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), timeoutMs);
        socket.once(event, (payload) => { clearTimeout(timer); resolve(payload); });
    });
}

function emitAck(socket, event, payload, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout waiting for ack of "${event}"`)), timeoutMs);
        socket.emit(event, payload, (ack) => { clearTimeout(timer); resolve(ack); });
    });
}

// Demo credentials seeded by src/database/seeds/demo.sql
const USERS = {
    admin: { email: 'admin@sneplus.live', password: 'Admin123!' },
    host: { email: 'omar@ex.com', password: 'Buyer123!' },
    ali: { email: 'ali@ex.com', password: 'Buyer123!' },
    sara: { email: 'sara@ex.com', password: 'Buyer123!' }
};

module.exports = {
    setup, api, login,
    socketConnect, socketReady, waitFor, emitAck,
    USERS
};