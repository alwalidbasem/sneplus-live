const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const env = require('./env');
const pool = require('./database');

// Shared between Express and Socket.IO so both see the same logged-in user.
function createSessionMiddleware() {
    return session({
        store: new pgSession({
            pool,
            tableName: 'session'
        }),
        secret: env.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: env.env === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    });
}

module.exports = { createSessionMiddleware };
