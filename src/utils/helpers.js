// Wraps async route handlers so rejected promises reach the central error middleware.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const toNumber = (value, fallback = null) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const roomFor = (liveSessionId) => `live:${liveSessionId}`;

const nowSeconds = () => Math.floor(Date.now() / 1000);

module.exports = { asyncHandler, toNumber, roomFor, nowSeconds };
