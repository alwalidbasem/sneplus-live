const env = require('../config/env');
const logger = require('../utils/logger');

function notFound(req, res) {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found.' }
    });
}

// Central error handler: logs details, returns safe messages only.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';

    if (status >= 500) {
        logger.error(`${req.method} ${req.originalUrl} ->`, err.stack || err.message);
    } else {
        logger.warn(`${req.method} ${req.originalUrl} -> ${code}: ${err.message}`);
    }

    // Never leak SQL errors / stack traces to clients.
    const message = status >= 500 && !env.isDev
        ? 'Something went wrong. Please try again.'
        : err.message;


    res.status(status).json({
        success: false,
        error: { code, message }
    });
}

module.exports = { notFound, errorHandler };
