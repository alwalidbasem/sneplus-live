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
        if (!text || !App.user) return;
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
        const $el = $('<div>').text('🤍').css({
            position: 'absolute', right: '24px', bottom: '170px',
            fontSize: '20px', zIndex: 25, transition: 'all 1.2s ease'
        });
        $('#phoneScreen').append($el);
        requestAnimationFrame(() => {
            $el.css({ transform: 'translateY(-220px) translateX(-10px)', opacity: '0' });
        });
        setTimeout(() => $el.remove(), 1300);
    }
};
