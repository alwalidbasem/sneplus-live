// Comments + heart reactions. Rendering only; the server stores comments and
// rate-limits/sanitizes them. Hearts are ephemeral realtime events.
const Comments = {
    MAX_SHOWN: 30,

    init() {
        $(document).on('comment:new', (e, c) => Comments.add(c.displayName, c.message));
        $(document).on('comment:rejected', (e, error) => Toast.show(error.message, 'error'));

        $('#sendCommentBtn').on('click', Comments.send);
        $('#commentInput').on('keydown', (ev) => { if (ev.key === 'Enter') Comments.send(); });
        $('#sendHeartBtn').on('click', () => {
            LiveSocket.socket.emit('reaction:send', { liveSessionId: LiveSocket.liveSessionId, type: 'heart' });
            Comments.heartAnimation();
        });

        $(document).on('reaction:new', () => Comments.heartAnimation());
    },

    send() {
        const text = $('#commentInput').val().trim();
        if (!text) return;
        if (!App.user) {
            Toast.show('Log in to comment.', 'error');
            return;
        }
        LiveSocket.socket.emit('comment:send', { liveSessionId: LiveSocket.liveSessionId, message: text });
        $('#commentInput').val('');
    },

    add(name, message) {
        const safeName = Helpers.escapeHtml(name);
        const safeMsg = Helpers.escapeHtml(message);
        const isMe = App.user && name === App.user.name;
        const color = isMe ? 'text-hype' : 'text-gold';
        const $line = $(
            `<div class="comment-in bg-black/40 rounded-xl px-3 py-1.5 text-xs leading-snug w-fit max-w-full">` +
            `<span class="font-bold ${color}">${safeName}</span> <span class="text-white/90">${safeMsg}</span></div>`
        );
        const $feed = $('#commentsFeed');
        $feed.append($line);
        while ($feed.children().length > Comments.MAX_SHOWN) $feed.children().first().remove();
    },

    heartAnimation() {
        Helpers.heartFloat($('<div>').text('🤍').css({ position: 'absolute', fontSize: '20px', zIndex: 25 }));
    }
};
