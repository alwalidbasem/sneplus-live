const LandingLivePreview = {
    timers: [],
    item: null,
    viewers: 0,
    currentBid: 0,

    async init() {
        if (!$('#landingPhoneScreen').length || window.matchMedia('(max-width: 767px)').matches) return;
        try {
            const res = await API.get('/api/live/simulator-config');
            const config = res.data.config || {};
            const products = Array.isArray(config.products) ? config.products : [];
            LandingLivePreview.item = products[0] || LandingLivePreview.defaultItem();
            LandingLivePreview.renderItem(LandingLivePreview.item);
            LandingLivePreview.applyVideo(config.liveVideoUrl || '');
            LandingLivePreview.startLoop();
        } catch (xhr) {
            LandingLivePreview.item = LandingLivePreview.defaultItem();
            LandingLivePreview.renderItem(LandingLivePreview.item);
            LandingLivePreview.startLoop();
        }
    },

    defaultItem() {
        return {
            name: 'Air Icon Runner',
            icon: 'SH',
            imageUrl: '',
            category: 'Sneakers',
            type: 'auction',
            start: 5,
            initialViewers: 12,
            comments: [
                { after: 1, name: 'Sara', comment: 'These look clean.' },
                { after: 4, name: 'Omar', comment: 'Ship to Jordan?' },
                { after: 8, name: 'Lina', comment: 'Last bid is coming.' }
            ],
            joins: [
                { after: 1, action: 'joined', name: 'Ali' },
                { after: 3, action: 'joined', name: 'Rana' },
                { after: 6, action: 'joined', name: 'Yousef' }
            ],
            viewerUpdates: [
                { after: 2, viewers: 18 },
                { after: 7, viewers: 31 }
            ],
            bids: [
                { after: 3, bid_amount: 7, bidder_username: 'Ali' },
                { after: 6, bid_amount: 10, bidder_username: 'Rana' },
                { after: 10, bid_amount: 15, bidder_username: 'Lina' }
            ]
        };
    },

    applyVideo(url) {
        const video = $('#landingHostVideo')[0];
        const safeUrl = String(url || '').trim();
        if (!safeUrl || !video) {
            $('#landingHostVideo').addClass('hidden').removeAttr('src');
            $('#landingVideoLayer').removeClass('hidden');
            return;
        }
        $('#landingVideoLayer').addClass('hidden');
        $('#landingHostVideo').removeClass('hidden').attr('src', safeUrl);
        video.load();
        const play = video.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
    },

    renderItem(item) {
        const start = Number(item.start) || 1;
        LandingLivePreview.currentBid = start;
        LandingLivePreview.viewers = Math.max(0, Number(item.initialViewers) || 1);
        $('#landingViewerCount').text(LandingLivePreview.viewers);
        $('#landingProductName').text(item.name || 'Live product');
        $('#landingBidLabel').text(item.type === 'buynow' ? 'Buy it now' : 'Starting at');
        $('#landingCurrentBid').text('$' + start);
        $('#landingCommentsFeed, #landingJoinToastArea').empty();
        $('#landingWinningLine').addClass('hidden').text('');
        LandingLivePreview.renderProductThumb(item);
    },

    renderProductThumb(item) {
        const imageUrl = String(item.imageUrl || item.image_url || '').trim();
        const $target = $('#landingProductIcon').empty().toggleClass('overflow-hidden', !!imageUrl);
        if (imageUrl) {
            $target.append(`<img src="${Helpers.escapeHtml(imageUrl)}" alt="" class="w-full h-full object-cover" />`);
            return;
        }
        $target.text(item.icon || 'IT');
    },

    startLoop() {
        LandingLivePreview.clearTimers();
        LandingLivePreview.renderItem(LandingLivePreview.item);

        const events = LandingLivePreview.buildEvents(LandingLivePreview.item);
        events.forEach((event) => {
            LandingLivePreview.timers.push(setTimeout(() => LandingLivePreview.runEvent(event), event.after * 1000));
        });

        const last = events.reduce((max, event) => Math.max(max, event.after), 0);
        LandingLivePreview.timers.push(setTimeout(() => LandingLivePreview.startLoop(), Math.max(12, last + 5) * 1000));
    },

    clearTimers() {
        LandingLivePreview.timers.forEach((timer) => clearTimeout(timer));
        LandingLivePreview.timers = [];
    },

    buildEvents(item) {
        const comments = LandingLivePreview.normalizeArray(item.comments);
        const joins = LandingLivePreview.normalizeArray(item.joins);
        const viewerUpdates = LandingLivePreview.normalizeArray(item.viewerUpdates);
        const bids = LandingLivePreview.normalizeArray(item.bids);

        const events = [
            ...joins.map((join) => ({ type: 'join', after: Number(join.after) || 0, data: join })),
            ...viewerUpdates.map((update) => ({ type: 'viewers', after: Number(update.after) || 0, data: update })),
            ...comments.map((comment) => ({ type: 'comment', after: Number(comment.after) || 0, data: comment })),
            ...bids.map((bid) => ({ type: 'bid', after: Number(bid.after) || 0, data: bid }))
        ].filter((event) => event.after >= 0);

        if (!events.length) {
            return LandingLivePreview.buildEvents(LandingLivePreview.defaultItem());
        }
        return events.sort((a, b) => a.after - b.after).slice(0, 18);
    },

    normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    },

    runEvent(event) {
        if (event.type === 'join') {
            LandingLivePreview.applyViewerActivity(event.data);
        } else if (event.type === 'viewers') {
            LandingLivePreview.viewers = Math.max(0, Number(event.data.viewers) || LandingLivePreview.viewers);
            $('#landingViewerCount').text(LandingLivePreview.viewers);
        } else if (event.type === 'comment') {
            LandingLivePreview.addComment(event.data.name || event.data.user || 'Viewer', event.data.comment || event.data.text || '');
        } else if (event.type === 'bid') {
            const user = event.data.bidder_username || event.data.name || 'Viewer';
            LandingLivePreview.applyBid(user, Number(event.data.bid_amount) || LandingLivePreview.currentBid + 1);
        }
    },

    applyViewerActivity(viewer) {
        const name = viewer.name || 'Viewer';
        const action = viewer.action === 'left' ? 'left' : 'joined';
        LandingLivePreview.viewers += action === 'left' ? -1 : 1;
        LandingLivePreview.viewers = Math.max(0, LandingLivePreview.viewers);
        $('#landingViewerCount').text(LandingLivePreview.viewers);
        LandingLivePreview.joinToast(name, action);
    },

    joinToast(name, action) {
        const label = action === 'left' ? 'left' : 'joined';
        const $toast = $(`<div class="join-toast text-[11px] font-medium bg-black/45 rounded-full pl-1 pr-2.5 py-1 inline-flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-gold text-ink flex items-center justify-center text-[9px] font-bold">${Helpers.escapeHtml(String(name).slice(0, 1).toUpperCase())}</span>
            <span>${Helpers.escapeHtml(name)} ${label}</span>
        </div>`);
        $('#landingJoinToastArea').append($toast);
        setTimeout(() => $toast.remove(), 3200);
    },

    addComment(user, message) {
        if (!message) return;
        const $line = $(`<div class="comment-in bg-black/45 rounded-xl px-3 py-1.5 text-xs leading-snug w-fit max-w-full">
            <span class="font-bold text-gold">${Helpers.escapeHtml(user)}</span>
            <span class="text-white/90">${Helpers.escapeHtml(message)}</span>
        </div>`);
        $('#landingCommentsFeed').append($line);
        while ($('#landingCommentsFeed').children().length > 5) $('#landingCommentsFeed').children().first().remove();
    },

    applyBid(user, amount) {
        LandingLivePreview.currentBid = Math.max(amount, LandingLivePreview.currentBid);
        $('#landingCurrentBid').text('$' + LandingLivePreview.currentBid).removeClass('bid-flash');
        void $('#landingCurrentBid')[0].offsetWidth;
        $('#landingCurrentBid').addClass('bid-flash');
        $('#landingBidLabel').text(user + ' bids');
        $('#landingWinningLine').removeClass('hidden').text(user + ' is winning');
        LandingLivePreview.addComment(user, 'bid $' + LandingLivePreview.currentBid);
    }
};
