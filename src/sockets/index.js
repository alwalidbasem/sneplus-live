const { socketFail } = require('../utils/response');

// Registers all socket handlers. sessionMiddleware is the same express-session
// middleware used by Express, so sockets share the authenticated user.
function initSocket(io, sessionMiddleware) {
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    io.on('connection', (socket) => {
        const user = socket.request.session ? socket.request.session.user : null;
        socket.data.user = user;

        require('./viewer.socket').register(io, socket);
        require('./live.socket').register(io, socket);
        require('./bid.socket').register(io, socket);
        require('./comment.socket').register(io, socket);

        socket.on('disconnect', () => {
            require('./viewer.socket').handleDisconnect(io, socket);
        });

        socket.on('error', (err) => {
            socket.emit('system:error', socketFail('SOCKET_ERROR', 'A realtime error occurred.'));
        });
    });
}

module.exports = { initSocket };
