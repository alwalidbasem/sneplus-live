require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    isDev: (process.env.NODE_ENV || 'development') !== 'production',
    trustProxy: parseInt(process.env.TRUST_PROXY, 10) || 0,

    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'sneplus_live',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },

    sessionSecret: process.env.SESSION_SECRET || 'dev-insecure-secret',

    upload: {
        dir: process.env.UPLOAD_DIR || 'public/uploads/products',
        maxBytes: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 5 * 1024 * 1024
    }
};

if (!process.env.SESSION_SECRET && !config.isDev) {
    console.error('FATAL: SESSION_SECRET must be set in production.');
    process.exit(1);
}

module.exports = config;
