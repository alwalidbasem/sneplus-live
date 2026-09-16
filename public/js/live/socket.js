// Socket.IO bootstrap for the live page. All state updates flow through here;
// the server is the source of truth for every auction decision.
const LiveSocket = {
    socket: null,
    liveSessionId: null,

    connect(liveSessionId) {
        LiveSocket.liveSessionId = liveSessionId;
        LiveSocket.socket = io();

        LiveSocket.socket.on('connect', () => {
            LiveSocket.socket.emit('live:join', { liveSessionId });
        });

        LiveSocket.socket.on('live:state', (state) => {
            $(document).trigger('live:state', [state]);
        });
        LiveSocket.socket.on('live:started', (state) => { $(document).trigger('live:started', [state]); });
        LiveSocket.socket.on('live:paused', () => { $(document).trigger('live:paused'); });
        LiveSocket.socket.on('live:resumed', () => { $(document).trigger('live:resumed'); });
        LiveSocket.socket.on('live:ended', () => { $(document).trigger('live:ended'); });

        LiveSocket.socket.on('item:started', (item) => { $(document).trigger('item:started', [item]); });
        LiveSocket.socket.on('item:ended', (item) => { $(document).trigger('item:ended', [item]); });

        LiveSocket.socket.on('bid:new', (payload) => { $(document).trigger('bid:new', [payload]); });
        LiveSocket.socket.on('bid:rejected', (error) => { $(document).trigger('bid:rejected', [error]); });

        LiveSocket.socket.on('comment:new', (payload) => { $(document).trigger('comment:new', [payload]); });
        LiveSocket.socket.on('comment:rejected', (error) => { $(document).trigger('comment:rejected', [error]); });
        LiveSocket.socket.on('reaction:new', (payload) => { $(document).trigger('reaction:new', [payload]); });

        LiveSocket.socket.on('viewer:update', (payload) => { $(document).trigger('viewer:update', [payload]); });

        LiveSocket.socket.on('product:sold', (payload) => { $(document).trigger('product:sold', [payload]); });
        LiveSocket.socket.on('product:unsold', (payload) => { $(document).trigger('product:unsold', [payload]); });
        LiveSocket.socket.on('winner:selected', (payload) => { $(document).trigger('winner:selected', [payload]); });
        LiveSocket.socket.on('buy-now:sold', (payload) => { $(document).trigger('buy-now:sold', [payload]); });
        LiveSocket.socket.on('auction:ended', (payload) => { $(document).trigger('auction:ended', [payload]); });

        LiveSocket.socket.on('disconnect', () => {
            Toast.show('Connection lost — reconnecting…', 'error');
        });
    },

    switchTo(liveSessionId) {
        if (!LiveSocket.socket || LiveSocket.liveSessionId === liveSessionId) return;
        LiveSocket.socket.emit('live:leave', { liveSessionId: LiveSocket.liveSessionId });
        LiveSocket.liveSessionId = liveSessionId;
        LiveSocket.socket.emit('live:join', { liveSessionId });
    },

    emit(event, payload) {
        return new Promise((resolve) => {
            LiveSocket.socket.emit(event, payload, (ack) => resolve(ack || { success: true }));
        });
    }
};
