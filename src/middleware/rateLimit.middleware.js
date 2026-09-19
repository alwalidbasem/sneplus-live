const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again shortly.' } }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.isDev ? 100 : 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } }
});

const waitlistLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registrations from this IP. Try again later.' } }
});

module.exports = { apiLimiter, loginLimiter, waitlistLimiter };