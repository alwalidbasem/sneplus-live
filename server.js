const path = require('path');
const env = require('./src/config/env');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');

const { createSessionMiddleware } = require('./src/config/session');
const { initSocket } = require('./src/sockets');
const routes = require('./src/routes/index.routes');
const { apiLimiter } = require('./src/middleware/rateLimit.middleware');
const { notFound, errorHandler } = require('./src/middleware/error.middleware');
const auctionService = require('./src/services/auction.service');
const logger = require('./src/utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: env.isDev ? true : false, credentials: true }
});

const sessionMiddleware = createSessionMiddleware();

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);
app.use(helmet({ contentSecurityPolicy: false })); // CSP off: pages use the Tailwind/CDN scripts
app.use(cors({ origin: env.isDev ? true : false, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js/sim', express.static(path.join(__dirname, 'src', 'simulation')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// clean page routes
const sendPage = (page) => (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', page));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/live', sendPage('live.html'));
app.get('/waitlist', sendPage('waitlist.html'));
app.get('/login', sendPage('login.html'));
app.get('/admin', sendPage('admin.html'));

// API
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

initSocket(io, sessionMiddleware);

server.listen(env.port, async () => {
    logger.info(`Sneplus Live running on http://localhost:${env.port} (${env.env})`);
    try {
        await auctionService.recoverActiveAuctions(io);
    } catch (err) {
        logger.error('Auction recovery failed:', err.message);
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${env.port} is already in use. Stop the other process (e.g. an old "node server.js") or change PORT in .env, then try again.`);
        process.exit(1);
    }
    throw err;
});


// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
