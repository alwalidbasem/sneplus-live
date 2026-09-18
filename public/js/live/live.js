// Frontend-only Live simulator.
// No database writes, no sockets: this page is a controlled MVP recording tool.
const LiveSim = {
    scenarios: [
        { name: 'Air Icon Runner', icon: 'SH', imageUrl: '', category: 'Sneakers', type: 'auction', start: 1, initialViewers: 1, startAfter: 8, auctionStartAfter: 4, bidDuration: 29, countdownAt: 35, videoUrl: '', joins: [
            { after: 3, action: 'joined', name: 'Ali', pfp_url: '' },
            { after: 5, action: 'joined', name: 'Sara', pfp_url: '' },
            { after: 15, action: 'joined', name: 'Mohammad', pfp_url: '' }
        ], viewerUpdates: [
            { after: 23, viewers: 18 },
            { after: 34, viewers: 31 }
        ], comments: [
            { after: 6, name: 'Sara', comment: 'These look clean.' },
            { after: 18, name: 'Rana', comment: 'Who has size 42?' },
            { after: 25, name: 'Omar', comment: 'Ship to Jordan?' },
            { after: 30, name: 'Lina', comment: 'Last bid is coming.' }
        ], bids: [
            { after: 15, bid_amount: 1, bidder_username: 'Ali' },
            { after: 20, bid_amount: 2, bidder_username: 'Mohammad' },
            { after: 27, bid_amount: 3, bidder_username: 'Sara' },
            { after: 32, bid_amount: 5, bidder_username: 'Omar' },
            { after: 38, bid_amount: 7, bidder_username: 'Lina' }
        ], status: 'pending' },
        { name: 'iPhone Pro Drop', icon: 'PH', imageUrl: '', category: 'Phones', type: 'auction', start: 1, initialViewers: 1, startAfter: 6, auctionStartAfter: 5, bidDuration: 42, videoUrl: '', joins: [
            { after: 4, action: 'joined', name: 'Namo', pfp_url: '' },
            { after: 12, action: 'joined', name: 'Sara', pfp_url: '' }
        ], viewerUpdates: [{ after: 30, viewers: 42 }], comments: [
            { after: 9, name: 'Sara', comment: 'Storage?' },
            { after: 25, name: 'Namo', comment: 'Sealed box?' }
        ], bids: [
            { after: 14, bid_amount: 1, bidder_username: 'Namo' },
            { after: 19, bid_amount: 10, bidder_username: 'Sara' },
            { after: 25, bid_amount: 25, bidder_username: 'Ali' },
            { after: 31, bid_amount: 50, bidder_username: 'Rana' },
            { after: 38, bid_amount: 75, bidder_username: 'Omar' },
            { after: 50, bid_amount: 120, bidder_username: 'Lina' }
        ], status: 'pending' },
        { name: 'Chrono Steel Watch', icon: 'WA', imageUrl: '', category: 'Watches', type: 'auction', start: 10, initialViewers: 1, startAfter: 6, auctionStartAfter: 4, bidDuration: 34, videoUrl: '', joins: [{ after: 5, action: 'joined', name: 'Yousef', pfp_url: '' }], viewerUpdates: [{ after: 25, viewers: 22 }], comments: [{ after: 13, name: 'Dana', comment: 'Beautiful dial.' }], bids: [
            { after: 13, bid_amount: 10, bidder_username: 'Yousef' },
            { after: 18, bid_amount: 20, bidder_username: 'Dana' },
            { after: 24, bid_amount: 35, bidder_username: 'Rana' },
            { after: 31, bid_amount: 50, bidder_username: 'Khaled' },
            { after: 41, bid_amount: 85, bidder_username: 'Farah' }
        ], status: 'pending' },
        { name: 'Signature Branded Bag', icon: 'BG', imageUrl: '', category: 'Fashion', type: 'auction', start: 5, initialViewers: 1, startAfter: 6, auctionStartAfter: 4, bidDuration: 34, videoUrl: '', joins: [{ after: 4, action: 'joined', name: 'Farah', pfp_url: '' }], viewerUpdates: [{ after: 28, viewers: 27 }], comments: [{ after: 16, name: 'Nour', comment: 'Show the inside please.' }], bids: [
            { after: 13, bid_amount: 5, bidder_username: 'Farah' },
            { after: 18, bid_amount: 10, bidder_username: 'Khaled' },
            { after: 24, bid_amount: 20, bidder_username: 'Nour' },
            { after: 31, bid_amount: 35, bidder_username: 'Dana' },
            { after: 41, bid_amount: 60, bidder_username: 'Rana' }
        ], status: 'pending' },
        { name: 'Mystery Product', icon: 'MY', imageUrl: '', category: 'Other', type: 'auction', start: 1, initialViewers: 1, startAfter: 6, auctionStartAfter: 4, bidDuration: 34, videoUrl: '', joins: [{ after: 4, action: 'joined', name: 'Omar', pfp_url: '' }], viewerUpdates: [{ after: 29, viewers: 35 }], comments: [{ after: 15, name: 'Ali', comment: 'Open it!' }], bids: [
            { after: 13, bid_amount: 1, bidder_username: 'Omar' },
            { after: 18, bid_amount: 5, bidder_username: 'Ali' },
            { after: 25, bid_amount: 10, bidder_username: 'Mohammad' },
            { after: 32, bid_amount: 20, bidder_username: 'Sara' },
            { after: 41, bid_amount: 35, bidder_username: 'Lina' }
        ], status: 'pending' }
    ],
    names: ['Ali', 'Mohammad', 'Sara', 'Omar', 'Lina', 'Yousef', 'Farah', 'Khaled', 'Dana', 'Rana'],
    comments: ['Fire fire fire', 'Who has size 42?', 'I want these!', 'Ship to Jordan?', 'This is insane', 'Worth it!', 'Do another one', 'Take my money'],
    currentIndex: 0,
    events: [],
    fired: 0,
    elapsedMs: 0,
    itemClockStartedAtMs: null,
    itemElapsedBeforePauseMs: 0,
    liveStartedAtMs: null,
    liveElapsedBeforePauseMs: 0,
    liveClockStartedAtMs: null,
    autoNextTimer: null,
    saveTimer: null,
    configLoaded: false,
    timer: null,
    running: false,
    liveStarted: false,
    viewers: 0,
    viewerRoster: new Set(),
    viewerLeftLog: new Set(),
    lastWinner: null,
    auctionDeadline: null,
    itemEnded: false,
    editingIndex: null,

    async init() {
        await App.init({ navActive: 'live' });
        await LiveSim.loadSavedConfig();
        LiveSim.bind();
        LiveSim.reset();
        LiveSim.applyRoleMode();
    },

    applyRoleMode() {
        if (LiveSim.isAdminUser()) {
            $('#controlPanel').removeClass('hidden');
            $('#panelToggleBtn').removeClass('hidden');
            return;
        }
        $('#controlPanel, #panelToggleBtn, #mainNav').addClass('hidden');
        $('#liveWrap').addClass('content-mode');
        $('#view-live').addClass('!py-0');
        setTimeout(() => {
            if (!LiveSim.liveStarted) LiveSim.startLive();
        }, 700);
    },

    bind() {
        $('#btnStart').on('click', () => LiveSim.startLive());
        $('#btnSaveSetup').on('click', () => LiveSim.saveConfig({ quiet: false }));
        $('#btnPause').on('click', () => LiveSim.pause());
        $('#btnResume').on('click', () => LiveSim.resume());
        $('#btnRestart').on('click', () => LiveSim.restart());
        $('#btnEndLive').on('click', () => {
            if (LiveSim.productLocked()) {
                Toast.show('A bid is active. Wait until the timer ends before ending this product.', 'info');
                return;
            }
            LiveSim.showEndLive();
        });
        $('#btnContentMode').on('click', () => LiveSim.enterContentMode());
        $('#exitContentBtn').on('click', () => LiveSim.exitContentMode());
        $('#panelToggleBtn').on('click', () => LiveSim.toggleControlPanel());
        $('#panelCloseBtn, #panelBackdrop').on('click', () => LiveSim.toggleControlPanel(false));
        $('#followBtn').on('click', () => LiveSim.toggleFollow());
        $('#sendCommentBtn').on('click', () => LiveSim.sendComment());
        $('#commentInput').on('keydown', (ev) => { if (ev.key === 'Enter') LiveSim.sendComment(); });
        $('#sendHeartBtn').on('click', () => LiveSim.heart());
        $('#bidBtn').on('click', () => LiveSim.openBidModal());
        $('#closeBidBtn').on('click', () => Modal.close('bidModal'));
        $('#bidInput').on('input keydown', (ev) => {
            LiveSim.validateBid();
            if (ev.type === 'keydown' && ev.key === 'Enter') LiveSim.confirmBid();
        });
        $('#confirmBidBtn').on('click', () => LiveSim.confirmBid());
        $('#closeBuyNowBtn').on('click', () => Modal.close('buyNowModal'));
        $('#confirmBuyBtn').on('click', () => LiveSim.confirmBuy());
        $('#btnAddItem').on('click', () => LiveSim.openItemModal());
        $('#liveVideoUrl').on('change blur', () => LiveSim.scheduleConfigSave());
        $('#itemType').on('change', () => LiveSim.onItemTypeChange());
        $('#closeItemBtn').on('click', () => Modal.close('itemModal'));
        $('#saveItemBtn').on('click', () => LiveSim.saveItem());

        $('#scenarioList').on('click', '[data-select]', function () {
            LiveSim.selectScenario(Number($(this).data('select')));
        });
        $('#scenarioList').on('click', '[data-edit]', function (ev) {
            ev.stopPropagation();
            LiveSim.openItemModal(Number($(this).data('edit')));
        });
        $('#endOverlay').on('click', '[data-next]', () => LiveSim.showNextPicker());
        $('#endOverlay').on('click', '[data-pick]', function () {
            LiveSim.startItem(Number($(this).data('pick')), false);
        });
        $('#endOverlay').on('click', '[data-finish]', () => LiveSim.finishLive());
        $('#endOverlay').on('click', '[data-close-overlay]', () => LiveSim.hideOverlay());
        $('#endOverlay').on('click', '[data-reset]', () => LiveSim.restart());
    },

    current() {
        return LiveSim.scenarios[LiveSim.currentIndex];
    },

    isAdminUser() {
        return Helpers.isAdmin(App.user);
    },

    userCanBid() {
        return !LiveSim.isAdminUser();
    },

    isContentMode() {
        return $('#liveWrap').hasClass('content-mode');
    },

    productLocked() {
        return LiveSim.liveStarted && !LiveSim.itemEnded && !!LiveSim.lastWinner;
    },

    canSwitchProduct() {
        return !LiveSim.liveStarted || LiveSim.itemEnded || !LiveSim.lastWinner;
    },

    async loadSavedConfig() {
        try {
            const res = await API.get('/api/live/simulator-config');
            const config = res.data.config || {};
            if (Array.isArray(config.products) && config.products.length) {
                LiveSim.scenarios = config.products.map((item) => ({ ...item, status: 'pending' }));
            }
            $('#liveVideoUrl').val(config.liveVideoUrl || '');
            LiveSim.configLoaded = true;
        } catch (xhr) {
            LiveSim.configLoaded = true;
            Toast.show(API.errorText(xhr), 'error');
        }
    },

    configPayload() {
        return {
            liveVideoUrl: LiveSim.liveVideoUrl(),
            products: LiveSim.scenarios.map((item) => ({
                name: item.name,
                icon: item.icon,
                imageUrl: item.imageUrl || '',
                category: item.category,
                type: item.type,
                start: item.start,
                initialViewers: item.initialViewers || 1,
                startAfter: item.startAfter,
                auctionStartAfter: item.auctionStartAfter || 0,
                bidDuration: item.bidDuration,
                countdownAt: item.countdownAt,
                joins: LiveSim.normalizeJoins(item.joins),
                viewerUpdates: LiveSim.normalizeViewerUpdates(item.viewerUpdates),
                comments: LiveSim.normalizeComments(item.comments),
                bids: LiveSim.normalizeBids(item.bids).map((bid) => ({
                    name: bid.name || bid.bidder_username,
                    bid_amount: bid.bid_amount,
                    after: bid.after
                }))
            }))
        };
    },

    scheduleConfigSave() {
        if (!LiveSim.isAdminUser() || !LiveSim.configLoaded) return;
        clearTimeout(LiveSim.saveTimer);
        LiveSim.saveTimer = setTimeout(() => LiveSim.saveConfig(), 350);
    },

    async saveConfig({ quiet = true } = {}) {
        if (!LiveSim.isAdminUser() || !LiveSim.configLoaded) return;
        clearTimeout(LiveSim.saveTimer);
        LiveSim.saveTimer = null;
        try {
            const res = await API.put('/api/live/simulator-config', LiveSim.configPayload());
            const config = res.data.config || {};
            if (Array.isArray(config.products) && config.products.length) {
                const statuses = new Map(LiveSim.scenarios.map((item) => [item.name, item.status]));
                LiveSim.scenarios = config.products.map((item) => ({
                    ...item,
                    status: statuses.get(item.name) || 'pending'
                }));
            }
            if (!quiet) Toast.show('Live setup saved', 'success');
            LiveSim.renderScenarioList();
        } catch (xhr) {
            Toast.show(API.errorText(xhr), 'error');
        }
    },

    reset() {
        clearInterval(LiveSim.timer);
        clearTimeout(LiveSim.autoNextTimer);
        LiveSim.timer = null;
        LiveSim.autoNextTimer = null;
        LiveSim.running = false;
        LiveSim.liveStarted = false;
        LiveSim.events = [];
        LiveSim.fired = 0;
        LiveSim.elapsedMs = 0;
        LiveSim.liveStartedAtMs = null;
        LiveSim.itemClockStartedAtMs = null;
        LiveSim.itemElapsedBeforePauseMs = 0;
        LiveSim.liveElapsedBeforePauseMs = 0;
        LiveSim.liveClockStartedAtMs = null;
        LiveSim.viewers = 0;
        LiveSim.viewerRoster = new Set();
        LiveSim.viewerLeftLog = new Set();
        LiveSim.lastWinner = null;
        LiveSim.auctionDeadline = null;
        LiveSim.itemEnded = false;
        LiveSim.scenarios.forEach((s) => { s.status = 'pending'; });

        $('#waitingState').removeClass('hidden').find('p').first().text('Waiting for the Live to start');
        $('#waitingState').find('p').last().text('Pick a scenario and hit Start Live');
        $('#productArea').addClass('hidden');
        $('#endOverlay').addClass('hidden').removeClass('flex').empty();
        $('#commentsFeed, #joinToastArea, #eventLog, #countdownOverlay').empty();
        $('#winningLine').addClass('hidden').text('');
        $('#viewerCount').text('0');
        $('#liveStatusPill').text('LIVE');
        $('#bidTimer').addClass('hidden');
        $('#bidBtn').prop('disabled', true).text(LiveSim.userCanBid() ? 'Bid' : 'Host cannot bid');
        $('#btnStart').prop('disabled', false);
        $('#btnPause, #btnResume, #btnEndLive').prop('disabled', true);
        LiveSim.renderScenarioList();
        LiveSim.previewItem(LiveSim.current());
        LiveSim.resetVideo();
    },

    restart() {
        LiveSim.reset();
        setTimeout(() => LiveSim.startLive(), 0);
    },

    renderScenarioList() {
        const html = LiveSim.scenarios.map((s, i) => {
            const active = i === LiveSim.currentIndex ? ' active' : '';
            const status = s.status === 'sold' ? 'Sold' : s.status === 'unsold' ? 'Unsold' : s.status === 'active' ? 'Active' : '';
            const meta = s.type === 'buynow'
                ? `Shows after ${s.startAfter || 0}s - Price $${s.start}`
                : `Shows after ${s.startAfter || 0}s - Start $${s.start} - ${s.bidDuration}s`;
            const locked = LiveSim.productLocked() && i !== LiveSim.currentIndex;
            const disabledClass = locked || s.status === 'sold' ? ' opacity-45 cursor-not-allowed' : '';
            const lockBadge = locked ? '<span class="text-[10px] font-semibold text-muted">Locked</span>' : '';
            return `
                <div class="flex items-center gap-1">
                    <button data-select="${i}" ${locked ? 'disabled' : ''} class="scenario-card${active}${disabledClass} flex-1 min-w-0 text-left flex items-center gap-3 px-3 py-2 rounded-xl border border-line hover:border-white/30 transition">
                        ${LiveSim.productThumbHtml(s, 'w-8 h-8 rounded-lg text-[11px]')}
                        <span class="flex-1 min-w-0">
                            <span class="block text-sm font-semibold truncate">${Helpers.escapeHtml(s.name)}</span>
                            <span class="block text-[11px] text-muted">${meta}</span>
                        </span>
                        ${lockBadge}
                        ${status ? `<span class="text-[10px] font-semibold text-hype">${status}</span>` : ''}
                    </button>
                    <button data-edit="${i}" ${locked ? 'disabled' : ''} class="shrink-0 w-9 h-9 rounded-xl border border-line hover:border-hype text-xs transition${locked ? ' opacity-45 cursor-not-allowed' : ''}">Edit</button>
                </div>`;
        }).join('');
        $('#scenarioList').html(html);
    },

    selectScenario(index) {
        if (!LiveSim.scenarios[index] || LiveSim.scenarios[index].status === 'sold') return;
        if (LiveSim.liveStarted) {
            if (!LiveSim.canSwitchProduct()) {
                Toast.show('Product is locked after the first bid. Wait until the timer ends.', 'info');
                return;
            }
            LiveSim.startItem(index, false);
            return;
        }
        LiveSim.currentIndex = index;
        LiveSim.renderScenarioList();
        LiveSim.previewItem(LiveSim.current());
    },

    previewItem(item) {
        LiveSim.renderProductThumb('#productIcon', item);
        $('#productName').text(item.name);
        $('#productCategory').text(item.category);
        $('#bidLabel').text(item.type === 'buynow' ? 'Buy it now' : 'Starting at');
        $('#currentBid').text('$' + item.start);
        $('#statusPill').text(LiveSim.userCanBid() ? 'Not started' : 'Host view');
    },

    productThumbHtml(item, classes = 'w-12 h-12 rounded-xl text-2xl') {
        const imageUrl = String(item.imageUrl || item.image_url || '').trim();
        const safeClasses = Helpers.escapeHtml(classes);
        if (imageUrl) {
            return `<span class="${safeClasses} product-thumb bg-ink2 flex items-center justify-center shrink-0 overflow-hidden"><img src="${Helpers.escapeHtml(imageUrl)}" alt="" class="w-full h-full object-cover" /></span>`;
        }
        return `<span class="${safeClasses} product-thumb bg-ink2 flex items-center justify-center shrink-0 font-bold text-gold">${Helpers.escapeHtml(item.icon || 'IT')}</span>`;
    },

    renderProductThumb(selector, item) {
        const imageUrl = String(item.imageUrl || item.image_url || '').trim();
        const $target = $(selector).empty().toggleClass('overflow-hidden', !!imageUrl);
        if (imageUrl) {
            $target.append(`<img src="${Helpers.escapeHtml(imageUrl)}" alt="" class="w-full h-full object-cover" />`);
            return;
        }
        $target.text(item.icon || 'IT');
    },

    liveSeconds() {
        if (!LiveSim.liveStartedAtMs) return 0;
        if (!LiveSim.running || !LiveSim.liveClockStartedAtMs) {
            return Math.max(0, LiveSim.liveElapsedBeforePauseMs / 1000);
        }
        return Math.max(0, (LiveSim.liveElapsedBeforePauseMs + (performance.now() - LiveSim.liveClockStartedAtMs)) / 1000);
    },

    itemSeconds() {
        if (!LiveSim.itemClockStartedAtMs) return LiveSim.itemElapsedBeforePauseMs / 1000;
        if (!LiveSim.running) return LiveSim.itemElapsedBeforePauseMs / 1000;
        return Math.max(0, (LiveSim.itemElapsedBeforePauseMs + (performance.now() - LiveSim.itemClockStartedAtMs)) / 1000);
    },

    buildEvents(item, includeIntro, liveNow = 0) {
        const events = [];
        const t0 = Math.max(0, (Number(item.startAfter) || 0) - liveNow);
        const auctionAt = t0 + Math.max(0, Number(item.auctionStartAfter) || 0);
        events.push({ t: 0, type: 'VIEWER_UPDATE', viewers: Math.max(0, Number(item.initialViewers) || 1) });
        events.push({ t: t0, type: 'PRODUCT_START' });
        LiveSim.normalizeJoins(item.joins).forEach((join) => {
            events.push({ t: join.after, type: join.action === 'left' ? 'VIEWER_ACTIVITY' : 'VIEWER_JOIN', action: join.action, viewer: join });
        });
        LiveSim.normalizeViewerUpdates(item.viewerUpdates).forEach((update) => {
            events.push({ t: update.after, type: 'VIEWER_UPDATE', viewers: update.viewers });
        });
        LiveSim.normalizeComments(item.comments).forEach((comment) => {
            events.push({ t: comment.after, type: 'COMMENT', user: comment.name, text: comment.comment });
        });
        if (item.type === 'buynow') {
            events.push({ t: auctionAt, type: 'BUYNOW_START', amount: item.start });
            events.push({ t: auctionAt + 16, type: 'VIEWER_BUY', user: 'Omar' });
            return LiveSim.sortEvents(events);
        }

        events.push({ t: auctionAt, type: 'AUCTION_START', amount: item.start, duration: item.bidDuration });
        const normalizedBids = LiveSim.normalizeBids(item.bids);
        normalizedBids.forEach((bid, i) => {
            const at = bid.after;
            events.push({ t: at, type: 'BID', amount: bid.bid_amount, user: bid.bidder_username || LiveSim.names[i % LiveSim.names.length] });
        });
        const lastBidAt = Math.max(auctionAt, ...normalizedBids.map((bid) => bid.after));
        const duration = Math.max(Number(item.bidDuration) || 30, lastBidAt - auctionAt + 3);
        const end = auctionAt + duration;
        const countdownAt = Math.min(end - 3, Number.isFinite(Number(item.countdownAt)) ? Number(item.countdownAt) : end - 3);
        events.find((ev) => ev.type === 'AUCTION_START').duration = duration;
        events.push({ t: countdownAt, type: 'COUNTDOWN', value: 3 });
        events.push({ t: countdownAt + 1, type: 'COUNTDOWN', value: 2 });
        events.push({ t: countdownAt + 2, type: 'COUNTDOWN', value: 1 });
        events.push({ t: end, type: 'AUCTION_END' });
        return LiveSim.sortEvents(events);
    },

    sortEvents(events) {
        const priority = {
            VIEWER_UPDATE: 0,
            VIEWER_JOIN: 1,
            VIEWER_ACTIVITY: 1,
            COMMENT: 2,
            PRODUCT_START: 3,
            BUYNOW_START: 4,
            AUCTION_START: 4,
            BID: 5,
            COUNTDOWN: 6,
            VIEWER_BUY: 7,
            AUCTION_END: 8
        };
        return events
            .map((event, index) => ({ ...event, _order: index }))
            .sort((a, b) => a.t - b.t || (priority[a.type] ?? 50) - (priority[b.type] ?? 50) || a._order - b._order)
            .map(({ _order, ...event }) => event);
    },

    normalizeBids(bids) {
        return (Array.isArray(bids) ? bids : [])
            .map((bid, index) => {
                if (typeof bid === 'number') {
                    return {
                        after: 7 + index * 5,
                        bid_amount: bid,
                        name: LiveSim.names[index % LiveSim.names.length]
                    };
                }
                const name = String(bid.name || bid.bidder_username || '').trim();
                return {
                    after: Math.max(0, Number(bid.after) || 0),
                    bid_amount: Number(bid.bid_amount),
                    name,
                    bidder_username: name
                };
            })
            .filter((bid) => bid.bid_amount > 0)
            .sort((a, b) => a.after - b.after);
    },

    normalizeJoins(joins) {
        return (Array.isArray(joins) ? joins : [])
            .map((join) => {
                const rawAction = String(join.action || join.event || join.type || 'joined').trim().toLowerCase();
                const action = ['left', 'leave', 'leaved'].includes(rawAction) ? 'left' : 'joined';
                return {
                    after: Math.max(0, Number(join.after) || 0),
                    action,
                    name: String(join.name || '').trim(),
                    pfp_url: String(join.pfp_url || join.pfpUrl || '').trim()
                };
            })
            .filter((join) => join.name)
            .sort((a, b) => a.after - b.after);
    },

    normalizeViewerUpdates(updates) {
        return (Array.isArray(updates) ? updates : [])
            .map((update) => ({
                after: Math.max(0, Number(update.after) || 0),
                viewers: Math.max(0, Math.floor(Number(update.viewers) || 0))
            }))
            .sort((a, b) => a.after - b.after);
    },

    normalizeComments(comments) {
        return (Array.isArray(comments) ? comments : [])
            .map((comment) => ({
                after: Math.max(0, Number(comment.after) || 0),
                name: String(comment.name || comment.user || '').trim(),
                comment: String(comment.comment || comment.text || '').trim()
            }))
            .filter((comment) => comment.name && comment.comment)
            .sort((a, b) => a.after - b.after);
    },

    bidJson(bids) {
        return JSON.stringify(LiveSim.normalizeBids(bids).map((bid) => ({
            name: bid.name || bid.bidder_username,
            bid_amount: bid.bid_amount,
            after: bid.after
        })), null, 2);
    },

    joinsJson(joins) {
        return JSON.stringify(LiveSim.normalizeJoins(joins), null, 2);
    },

    commentsJson(comments) {
        return JSON.stringify(LiveSim.normalizeComments(comments), null, 2);
    },

    parseJsonConfig(raw) {
        const text = String(raw || '').trim();
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (firstError) {
            try {
                const parsed = JSON.parse(`[${text}]`);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (secondError) {
                throw firstError;
            }
        }
    },

    parseBidConfig(raw) {
        return LiveSim.parseJsonConfig(raw);
    },

    startLive() {
        LiveSim.saveConfig();
        LiveSim.liveStartedAtMs = Date.now();
        LiveSim.liveElapsedBeforePauseMs = 0;
        LiveSim.liveClockStartedAtMs = performance.now();
        LiveSim.startItem(LiveSim.currentIndex, true, true);
    },

    startItem(index, includeIntro, useAbsoluteSchedule = false) {
        const item = LiveSim.scenarios[index];
        if (!item || item.status === 'sold') return;
        if (LiveSim.liveStarted && !LiveSim.canSwitchProduct()) {
            Toast.show('Product is locked after the first bid. Wait until the timer ends.', 'info');
            return;
        }
        clearInterval(LiveSim.timer);
        clearTimeout(LiveSim.autoNextTimer);
        LiveSim.autoNextTimer = null;
        LiveSim.currentIndex = index;
        LiveSim.scenarios.forEach((s) => {
            if (s.status === 'active') s.status = LiveSim.lastWinner ? 'unsold' : 'pending';
        });
        item.status = 'active';
        LiveSim.liveStarted = true;
        if (!LiveSim.liveStartedAtMs) LiveSim.liveStartedAtMs = Date.now();
        const now = performance.now();
        LiveSim.running = true;
        LiveSim.itemClockStartedAtMs = now;
        LiveSim.itemElapsedBeforePauseMs = 0;
        if (!LiveSim.liveClockStartedAtMs) LiveSim.liveClockStartedAtMs = now;
        LiveSim.events = LiveSim.buildEvents(item, includeIntro, useAbsoluteSchedule ? LiveSim.liveSeconds() : 0);
        LiveSim.fired = 0;
        LiveSim.elapsedMs = 0;
        LiveSim.lastWinner = null;
        LiveSim.viewerRoster = new Set();
        LiveSim.viewerLeftLog = new Set();
        LiveSim.auctionDeadline = null;
        LiveSim.itemEnded = false;
        $('#waitingState').addClass('hidden');
        $('#endOverlay').addClass('hidden').removeClass('flex').empty();
        $('#winningLine').addClass('hidden').text('');
        $('#liveStatusPill').text('LIVE');
        $('#btnStart').prop('disabled', true);
        $('#btnPause').prop('disabled', false);
        $('#btnResume').prop('disabled', true);
        $('#btnEndLive').prop('disabled', false);
        LiveSim.previewItem(item);
        LiveSim.applyVideo();
        LiveSim.renderScenarioList();
        LiveSim.log(`${item.name} scheduled at ${item.startAfter || 0}s from live start`);
        LiveSim.timer = setInterval(() => LiveSim.tick(), 100);
        LiveSim.tick();
    },

    liveVideoUrl() {
        return String($('#liveVideoUrl').val() || '').trim();
    },

    beforePopup() {
        LiveSim.toggleControlPanel(false);
    },

    applyVideo() {
        const url = LiveSim.liveVideoUrl();
        const video = $('#hostVideo')[0];
        $('#videoTapOverlay').remove();
        if (!url) {
            $('#hostVideo').addClass('hidden').removeAttr('src');
            $('#videoLayer').removeClass('hidden');
            if (video) video.pause();
            $('#videoLayer').html('<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#15151b] to-[#050507] px-8 text-center"><div><p class="font-display text-2xl mb-2">SNEPLUS LIVE</p><p class="text-xs text-white/65">No host video configured. Add an MP4 URL in the internal panel for recordings.</p></div></div>');
            return;
        }
        $('#videoLayer').empty();
        $('#videoLayer').addClass('hidden');
        $('#hostVideo').removeClass('hidden').attr('src', url);
        if (video) {
            video.muted = true;
            video.playsInline = true;
            video.currentTime = Math.max(0, LiveSim.liveSeconds());
            if (video.getAttribute('src') !== url) video.load();
            LiveSim.tryPlayVideo();
        }
    },

    tryPlayVideo() {
        const video = $('#hostVideo')[0];
        if (!video) return;
        const attempt = video.play();
        if (!attempt || typeof attempt.catch !== 'function') return;
        attempt.catch(() => {
            $('#videoTapOverlay').remove();
            $('#phoneScreen').append(`
                <button id="videoTapOverlay" class="absolute inset-0 z-40 bg-black/55 flex flex-col items-center justify-center text-center px-8">
                    <span class="w-14 h-14 rounded-full bg-white text-ink flex items-center justify-center text-lg font-bold mb-3">Play</span>
                    <span class="text-sm font-semibold">Tap to start the demo video</span>
                </button>`);
            $('#videoTapOverlay').on('click', () => {
                $('#videoTapOverlay').remove();
                video.play().catch(() => {});
            });
        });
    },

    resetVideo() {
        const video = $('#hostVideo')[0];
        $('#videoTapOverlay').remove();
        if (video) {
            video.pause();
            video.currentTime = 0;
            video.removeAttribute('src');
            video.load();
        }
        $('#hostVideo').addClass('hidden');
        $('#videoLayer').removeClass('hidden').empty();
    },

    pause() {
        if (!LiveSim.running) return;
        const now = performance.now();
        LiveSim.itemElapsedBeforePauseMs += LiveSim.itemClockStartedAtMs ? now - LiveSim.itemClockStartedAtMs : 0;
        LiveSim.liveElapsedBeforePauseMs += LiveSim.liveClockStartedAtMs ? now - LiveSim.liveClockStartedAtMs : 0;
        LiveSim.itemClockStartedAtMs = null;
        LiveSim.liveClockStartedAtMs = null;
        LiveSim.running = false;
        clearInterval(LiveSim.timer);
        const video = $('#hostVideo')[0];
        if (video) video.pause();
        $('#liveStatusPill').text('PAUSED');
        $('#btnPause').prop('disabled', true);
        $('#btnResume').prop('disabled', false);
    },

    resume() {
        if (LiveSim.running) return;
        LiveSim.running = true;
        LiveSim.itemClockStartedAtMs = performance.now();
        LiveSim.liveClockStartedAtMs = performance.now();
        LiveSim.tryPlayVideo();
        $('#liveStatusPill').text('LIVE');
        $('#btnPause').prop('disabled', false);
        $('#btnResume').prop('disabled', true);
        clearInterval(LiveSim.timer);
        LiveSim.timer = setInterval(() => LiveSim.tick(), 100);
        LiveSim.tick();
    },

    tick() {
        const seconds = LiveSim.itemSeconds();
        LiveSim.elapsedMs = seconds * 1000;
        while (LiveSim.fired < LiveSim.events.length && LiveSim.events[LiveSim.fired].t <= seconds) {
            LiveSim.fire(LiveSim.events[LiveSim.fired]);
            LiveSim.fired += 1;
        }
        if (LiveSim.auctionDeadline !== null && !LiveSim.itemEnded) {
            const remain = Math.max(0, Math.ceil(LiveSim.auctionDeadline - seconds));
            $('#bidTimer').text(`Timer ${remain}s`);
        }
        if (LiveSim.fired >= LiveSim.events.length) {
            const now = performance.now();
            clearInterval(LiveSim.timer);
            LiveSim.running = false;
            LiveSim.itemElapsedBeforePauseMs = LiveSim.elapsedMs;
            LiveSim.itemClockStartedAtMs = null;
            LiveSim.liveElapsedBeforePauseMs += LiveSim.liveClockStartedAtMs ? now - LiveSim.liveClockStartedAtMs : 0;
            LiveSim.liveClockStartedAtMs = null;
        }
    },

    fire(ev) {
        LiveSim.log(`${String(ev.t).padStart(2, '0')}s ${ev.type}${ev.amount ? ' $' + ev.amount : ''}`);
        switch (ev.type) {
            case 'VIEWER_UPDATE':
                LiveSim.viewers = ev.viewers;
                $('#viewerCount').text(LiveSim.viewers);
                break;
            case 'VIEWER_ACTIVITY':
                LiveSim.applyViewerActivity(ev.viewer, ev.action);
                break;
            case 'VIEWER_JOIN':
                LiveSim.applyViewerActivity(ev.viewer, 'joined');
                break;
            case 'COMMENT':
                LiveSim.addComment(ev.user, ev.text);
                break;
            case 'PRODUCT_START':
                LiveSim.previewItem(LiveSim.current());
                $('#productArea').removeClass('hidden');
                break;
            case 'AUCTION_START':
                LiveSim.auctionDeadline = ev.t + ev.duration;
                $('#bidLabel').text('Starting bid');
                $('#currentBid').text('$' + ev.amount);
                $('#statusPill').text('Auction live');
                $('#bidTimer').removeClass('hidden').text(`Timer ${ev.duration}s`);
                $('#bidBtn')
                    .prop('disabled', !LiveSim.userCanBid())
                    .text(LiveSim.userCanBid() ? 'Bid' : 'Host cannot bid');
                break;
            case 'BUYNOW_START':
                $('#bidLabel').text('Buy it now');
                $('#currentBid').text('$' + ev.amount);
                $('#statusPill').text('Buy it now - first taker wins');
                $('#bidBtn')
                    .prop('disabled', !LiveSim.userCanBid())
                    .text(LiveSim.userCanBid() ? `Buy Now $${ev.amount}` : 'Host cannot buy');
                $('#bidTimer').addClass('hidden');
                break;
            case 'VIEWER_BUY':
                if (!LiveSim.itemEnded) LiveSim.endBuyNow(ev.user);
                break;
            case 'BID':
                LiveSim.applyBid(ev.user, ev.amount);
                break;
            case 'COUNTDOWN':
                LiveSim.countdown(ev.value);
                break;
            case 'AUCTION_END':
                LiveSim.endAuction();
                break;
        }
    },

    applyBid(user, amount) {
        LiveSim.lastWinner = { user, amount };
        $('#currentBid').text('$' + amount).removeClass('bid-flash');
        void $('#currentBid')[0].offsetWidth;
        $('#currentBid').addClass('bid-flash');
        $('#bidLabel').text(user + ' bids');
        $('#winningLine').removeClass('hidden').text(user === 'you' ? "You're winning!" : `${user} is winning!`);
        LiveSim.addComment(user, `bid $${amount}`);
        LiveSim.renderScenarioList();
    },

    endAuction() {
        LiveSim.itemEnded = true;
        LiveSim.auctionDeadline = null;
        $('#bidBtn').prop('disabled', true);
        $('#bidTimer').addClass('hidden');
        $('#statusPill').text('Bid ended');
        const item = LiveSim.current();
        if (LiveSim.lastWinner) {
            item.status = 'sold';
            LiveSim.showResult('BID ENDED', item, LiveSim.lastWinner);
        } else {
            item.status = 'unsold';
            LiveSim.showUnsold(item);
        }
        LiveSim.scheduleViewerNextProduct();
        LiveSim.renderScenarioList();
    },

    endBuyNow(user) {
        const now = performance.now();
        clearInterval(LiveSim.timer);
        LiveSim.itemElapsedBeforePauseMs = LiveSim.itemSeconds() * 1000;
        LiveSim.running = false;
        LiveSim.itemClockStartedAtMs = null;
        LiveSim.liveElapsedBeforePauseMs += LiveSim.liveClockStartedAtMs ? now - LiveSim.liveClockStartedAtMs : 0;
        LiveSim.liveClockStartedAtMs = null;
        LiveSim.itemEnded = true;
        const item = LiveSim.current();
        item.status = 'sold';
        LiveSim.lastWinner = { user, amount: item.start };
        $('#bidBtn').prop('disabled', true);
        $('#statusPill').text('Sold');
        LiveSim.showResult('SOLD!', item, LiveSim.lastWinner);
        LiveSim.scheduleViewerNextProduct();
        LiveSim.renderScenarioList();
    },

    nextScheduledIndex() {
        const currentStart = Number(LiveSim.current()?.startAfter) || 0;
        const candidates = LiveSim.scenarios
            .map((item, index) => ({ item, index, startAfter: Number(item.startAfter) || 0 }))
            .filter(({ item, index, startAfter }) => (
                index !== LiveSim.currentIndex &&
                (item.status === 'pending' || item.status === 'unsold') &&
                startAfter > currentStart
            ))
            .sort((a, b) => a.startAfter - b.startAfter || a.index - b.index);
        return candidates[0]?.index ?? null;
    },

    scheduleViewerNextProduct() {
        if (LiveSim.isAdminUser() && !LiveSim.isContentMode()) return;
        clearTimeout(LiveSim.autoNextTimer);
        const minResultHoldMs = 7000;
        const nextIndex = LiveSim.nextScheduledIndex();
        if (nextIndex === null) {
            LiveSim.autoNextTimer = setTimeout(() => LiveSim.finishLive(), minResultHoldMs);
            return;
        }
        const next = LiveSim.scenarios[nextIndex];
        const delayMs = Math.max(minResultHoldMs, ((Number(next.startAfter) || 0) - LiveSim.liveSeconds()) * 1000);
        const seconds = Math.ceil(delayMs / 1000);
        $('#statusPill').text(seconds > 0 ? `Next in ${seconds}s` : 'Next product');
        LiveSim.autoNextTimer = setTimeout(() => {
            LiveSim.startItem(nextIndex, false, true);
        }, delayMs);
    },

    showResult(title, item, winner) {
        LiveSim.beforePopup();
        LiveSim.addComment('Sneplus', `${winner.user} won ${item.name} for $${winner.amount}`);
        if (!LiveSim.isAdminUser()) {
            LiveSim.showViewerWinnerSequence(title, item, winner);
            return;
        }
        const autoProgress = !LiveSim.isAdminUser() || LiveSim.isContentMode();
        const actions = !autoProgress
            ? `<div class="flex gap-2 justify-center">
                    <button data-reset class="px-4 py-2.5 rounded-full border border-line hover:border-white/30 font-bold text-sm transition">Restart</button>
                    <button data-next class="px-4 py-2.5 rounded-full bg-hype hover:bg-hypedark font-bold text-sm transition">Continue</button>
                </div>`
            : '<p class="text-xs text-muted">Next product starts automatically.</p>';
        $('#endOverlay').html(`
            <div class="fade-up max-w-xs w-full">
                <p class="font-display text-2xl mb-1 tracking-tight">${title}</p>
                <p class="text-sm text-muted mb-4">${Helpers.escapeHtml(item.name)} has a winner</p>
                <div class="rounded-2xl bg-surface2 border border-gold/40 px-5 py-4 mb-5">
                    <p class="text-[11px] font-semibold text-gold uppercase tracking-wider mb-1">Winner</p>
                    <p class="font-display text-xl mb-2">${Helpers.escapeHtml(winner.user === 'you' ? 'You!' : winner.user)}</p>
                    <p class="font-display text-3xl text-gold">$${winner.amount}</p>
                </div>
                ${actions}
            </div>`).removeClass('hidden').addClass('flex');
    },

    showViewerWinnerSequence(title, item, winner) {
        const showNumber = (value) => {
            $('#endOverlay').html(`
                <div class="fade-up flex flex-col items-center justify-center">
                    <span class="count-pulse font-display text-gold text-8xl" style="text-shadow:0 8px 35px rgba(0,0,0,.65)">${value}</span>
                </div>`).removeClass('hidden').addClass('flex');
        };
        const showPrize = () => {
            const winnerName = Helpers.escapeHtml(winner.user === 'you' ? 'You' : winner.user);
            const productName = Helpers.escapeHtml(item.name);
            const resultLabel = item.type === 'buynow' ? 'First purchaser' : 'Top bidder';
            $('#endOverlay').html(`
                <div class="fade-up max-w-xs w-full">
                    <div class="mx-auto mb-4 w-24 h-24 rounded-full bg-gold text-ink flex items-center justify-center shadow-[0_0_55px_rgba(255,197,61,0.5)] border-4 border-white/25">
                        <div class="text-center">
                            <p class="font-display text-4xl leading-none">1</p>
                            <p class="text-[10px] font-black uppercase leading-none">Prize</p>
                        </div>
                    </div>
                    <p class="font-display text-2xl mb-1 tracking-tight text-gold">${title}</p>
                    <p class="text-sm text-muted mb-4">${productName}</p>
                    <div class="rounded-2xl bg-gold/15 border border-gold/50 px-5 py-4 mb-4">
                        <p class="text-[11px] font-semibold text-gold uppercase tracking-wider mb-1">${resultLabel}</p>
                        <p class="font-display text-2xl mb-2">${winnerName} Wins!</p>
                        <p class="font-display text-3xl text-gold">$${winner.amount}</p>
                    </div>
                    <p class="text-xs text-muted">Next product starts automatically.</p>
                </div>`).removeClass('hidden').addClass('flex');
        };
        showNumber(3);
        setTimeout(() => showNumber(2), 900);
        setTimeout(() => showNumber(1), 1800);
        setTimeout(showPrize, 2850);
    },

    showUnsold(item) {
        LiveSim.beforePopup();
        const autoProgress = !LiveSim.isAdminUser() || LiveSim.isContentMode();
        const actions = !autoProgress
            ? `<div class="flex gap-2 justify-center">
                    <button data-reset class="px-4 py-2.5 rounded-full border border-line hover:border-white/30 font-bold text-sm transition">Restart</button>
                    <button data-next class="px-4 py-2.5 rounded-full bg-hype hover:bg-hypedark font-bold text-sm transition">Continue</button>
                </div>`
            : '<p class="text-xs text-muted">Next product starts automatically.</p>';
        $('#endOverlay').html(`
            <div class="fade-up max-w-xs w-full">
                <p class="font-display text-2xl mb-1 tracking-tight">BID ENDED</p>
                <p class="text-sm text-muted mb-4">No bids were placed for ${Helpers.escapeHtml(item.name)}.</p>
                ${actions}
            </div>`).removeClass('hidden').addClass('flex');
    },

    showNextPicker() {
        LiveSim.beforePopup();
        const remaining = LiveSim.scenarios
            .map((s, index) => ({ ...s, index }))
            .filter((s) => s.status === 'pending' || s.status === 'unsold');
        if (!remaining.length) {
            LiveSim.showEndLive();
            return;
        }
        $('#endOverlay').html(`
            <div class="fade-up max-w-sm w-full max-h-[85%] overflow-y-auto">
                <p class="font-display text-xl mb-1 tracking-tight">Select Next Item</p>
                <p class="text-sm text-muted mb-4">${remaining.length} item(s) left to sell</p>
                <div class="space-y-2 mb-3">
                    ${remaining.map((s) => `
                        <div class="flex items-center gap-3 rounded-xl bg-surface2 border border-line px-3 py-2.5">
                            ${LiveSim.productThumbHtml(s, 'w-9 h-9 rounded-lg text-[11px]')}
                            <div class="flex-1 min-w-0 text-left">
                                <p class="text-sm font-semibold truncate">${Helpers.escapeHtml(s.name)}</p>
                                <p class="text-[11px] text-muted">${s.type === 'buynow' ? `Price $${s.start}` : `Start $${s.start} - ${s.bidDuration}s`}</p>
                            </div>
                            <button data-pick="${s.index}" class="shrink-0 px-3 py-2 rounded-full bg-hype hover:bg-hypedark font-bold text-xs transition">Select</button>
                        </div>`).join('')}
                </div>
                <button data-finish class="text-xs text-muted underline hover:text-text transition">End live anyway</button>
            </div>`);
    },

    showEndLive() {
        if (LiveSim.productLocked()) {
            Toast.show('A bid is active. Wait until the timer ends before ending this product.', 'info');
            return;
        }
        LiveSim.beforePopup();
        $('#endOverlay').html(`
            <div class="fade-up max-w-xs w-full">
                <p class="font-display text-2xl mb-1 tracking-tight">END LIVE</p>
                <p class="text-sm text-muted mb-6">Close this simulated live sale.</p>
                <div class="flex gap-2 justify-center">
                    <button data-close-overlay class="px-4 py-2.5 rounded-full border border-line hover:border-white/30 font-bold text-sm transition">Close</button>
                    <button data-finish class="px-4 py-2.5 rounded-full bg-hype hover:bg-hypedark font-bold text-sm transition">End Live</button>
                </div>
            </div>`).removeClass('hidden').addClass('flex');
    },

    finishLive() {
        LiveSim.beforePopup();
        clearInterval(LiveSim.timer);
        LiveSim.running = false;
        LiveSim.liveStarted = false;
        $('#liveStatusPill').text('ENDED');
        $('#bidBtn, #btnPause, #btnResume, #btnEndLive').prop('disabled', true);
        $('#btnStart').prop('disabled', false);
        $('#endOverlay').html(`
            <div class="fade-up max-w-xs w-full">
                <p class="font-display text-2xl mb-1 tracking-tight">LIVE FINISHED</p>
                <p class="text-sm text-muted mb-6">This live sale is closed.</p>
                <button data-reset class="px-5 py-2.5 rounded-full bg-hype hover:bg-hypedark font-bold text-sm">Restart live</button>
            </div>`).removeClass('hidden').addClass('flex');
    },

    hideOverlay() {
        $('#endOverlay').addClass('hidden').removeClass('flex').empty();
    },

    openBidModal() {
        LiveSim.beforePopup();
        if (!LiveSim.userCanBid()) {
            Toast.show('Admin/host is the product owner and cannot bid.', 'info');
            return;
        }
        if (LiveSim.itemEnded || LiveSim.current().type === 'buynow') {
            LiveSim.openBuyNowModal();
            return;
        }
        const current = Number($('#currentBid').text().replace('$', '')) || 0;
        $('#modalCurrentBid').text('$' + current);
        $('#bidInput').val(current + 1).attr('min', current + 1);
        $('#bidModalError').addClass('hidden');
        $('#confirmBidBtn').prop('disabled', false);
        Modal.open('bidModal');
        setTimeout(() => $('#bidInput').trigger('focus').trigger('select'), 50);
    },

    validateBid() {
        const current = Number($('#currentBid').text().replace('$', '')) || 0;
        const value = Number($('#bidInput').val());
        const invalid = !value || value <= current;
        $('#confirmBidBtn').prop('disabled', invalid);
        $('#bidModalError').toggleClass('hidden', !invalid).text(`Your bid must be higher than the current bid ($${current}).`);
        return !invalid;
    },

    confirmBid() {
        if (!LiveSim.userCanBid()) {
            Toast.show('Admin/host is the product owner and cannot bid.', 'info');
            Modal.close('bidModal');
            return;
        }
        if (!LiveSim.validateBid()) return;
        LiveSim.applyBid('you', Number($('#bidInput').val()));
        Modal.close('bidModal');
    },

    openBuyNowModal() {
        LiveSim.beforePopup();
        if (!LiveSim.userCanBid()) {
            Toast.show('Admin/host is the product owner and cannot buy.', 'info');
            return;
        }
        const item = LiveSim.current();
        $('#buyNowItemName').text(item.name);
        $('#buyNowPrice').text('$' + item.start);
        Modal.open('buyNowModal');
    },

    confirmBuy() {
        if (!LiveSim.userCanBid()) {
            Toast.show('Admin/host is the product owner and cannot buy.', 'info');
            Modal.close('buyNowModal');
            return;
        }
        Modal.close('buyNowModal');
        if (!LiveSim.itemEnded) LiveSim.endBuyNow('you');
    },

    openItemModal(index = null) {
        LiveSim.beforePopup();
        LiveSim.editingIndex = index;
        const item = index === null ? null : LiveSim.scenarios[index];
        $('#itemModalTitle').text(item ? 'Edit item' : 'Add item');
        $('#itemIcon').val(item ? item.icon : 'IT');
        $('#itemImageUrl').val(item ? (item.imageUrl || '') : '');
        $('#itemName').val(item ? item.name : '');
        $('#itemCategory').val(item ? item.category : '');
        $('#itemStartAfter').val(item ? item.startAfter || 0 : 30);
        $('#itemInitialViewers').val(item ? item.initialViewers || 1 : 1);
        $('#itemType').val(item ? item.type : 'auction');
        $('#itemStart').val(item ? item.start : 1);
        $('#itemAuctionStartAfter').val(item ? item.auctionStartAfter || 0 : 4);
        $('#itemCountdownAt').val(item && item.countdownAt !== undefined && item.countdownAt !== null ? item.countdownAt : '');
        $('#itemJoins').val(item && item.joins ? LiveSim.joinsJson(item.joins) : LiveSim.joinsJson([
            { after: 10, action: 'joined', name: 'Sara', pfp_url: 'https://example.com/sara.jpg' },
            { after: 25, action: 'left', name: 'Sara', pfp_url: 'https://example.com/sara.jpg' }
        ]));
        $('#itemComments').val(item && item.comments ? LiveSim.commentsJson(item.comments) : LiveSim.commentsJson([
            { after: 15, name: 'Sara', comment: 'Hello!' }
        ]));
        $('#itemViewerUpdates').val(item && item.viewerUpdates ? JSON.stringify(LiveSim.normalizeViewerUpdates(item.viewerUpdates), null, 2) : JSON.stringify([
            { after: 23, viewers: 18 }
        ], null, 2));
        $('#itemBids').val(item && item.bids ? LiveSim.bidJson(item.bids) : LiveSim.bidJson([
            { after: 30, bid_amount: 250, name: 'Sara' }
        ]));
        $('#itemBidDuration').val(item ? item.bidDuration || 30 : 30);
        $('#itemModalError').addClass('hidden');
        LiveSim.onItemTypeChange();
        Modal.open('itemModal');
    },

    onItemTypeChange() {
        const buyNow = $('#itemType').val() === 'buynow';
        $('#itemAuctionFields').toggleClass('hidden', buyNow);
        $('#itemStartLabel').text(buyNow ? 'Price ($)' : 'Start Price ($)');
    },

    saveItem() {
        const name = $('#itemName').val().trim();
        const category = $('#itemCategory').val().trim() || 'Other';
        const icon = $('#itemIcon').val().trim() || 'IT';
        const imageUrl = $('#itemImageUrl').val().trim();
        const type = $('#itemType').val();
        const start = Number($('#itemStart').val());
        const startAfter = Math.max(0, Number($('#itemStartAfter').val()) || 0);
        const initialViewers = Math.max(0, Math.floor(Number($('#itemInitialViewers').val()) || 0));
        const auctionStartAfter = Math.max(0, Number($('#itemAuctionStartAfter').val()) || 0);
        const countdownRaw = String($('#itemCountdownAt').val() || '').trim();
        const countdownAt = countdownRaw ? Math.max(0, Number(countdownRaw) || 0) : null;
        const fail = (message) => $('#itemModalError').text(message).removeClass('hidden');
        if (!name) return fail('Item name is required.');
        if (!start || start < 1) return fail('Enter a price of at least $1.');
        let joins;
        let comments;
        try {
            joins = LiveSim.normalizeJoins(LiveSim.parseJsonConfig($('#itemJoins').val()));
        } catch (e) {
            return fail('Viewer events must be valid JSON.');
        }
        try {
            comments = LiveSim.normalizeComments(LiveSim.parseJsonConfig($('#itemComments').val()));
        } catch (e) {
            return fail('Product comments must be valid JSON.');
        }
        let viewerUpdates;
        try {
            viewerUpdates = LiveSim.normalizeViewerUpdates(LiveSim.parseJsonConfig($('#itemViewerUpdates').val()));
        } catch (e) {
            return fail('Viewer count updates must be valid JSON.');
        }
        const item = { name, category, icon, imageUrl, type, start, startAfter, initialViewers, auctionStartAfter, countdownAt, joins, viewerUpdates, comments, status: 'pending' };
        if (type === 'auction') {
            let parsedBids;
            try {
                parsedBids = LiveSim.parseBidConfig($('#itemBids').val());
            } catch (e) {
                return fail('Bid sequence must be valid JSON.');
            }
            item.bids = LiveSim.normalizeBids(parsedBids);
            item.bidDuration = Math.max(5, Number($('#itemBidDuration').val()) || 30, ...item.bids.map((bid) => bid.after + 4));
            if (!item.bids.length) return fail('Enter at least one bid.');
        }
        if (LiveSim.editingIndex === null) {
            LiveSim.scenarios.push(item);
            LiveSim.currentIndex = LiveSim.scenarios.length - 1;
        } else {
            item.status = LiveSim.scenarios[LiveSim.editingIndex].status;
            LiveSim.scenarios[LiveSim.editingIndex] = item;
            LiveSim.currentIndex = LiveSim.editingIndex;
        }
        Modal.close('itemModal');
        LiveSim.renderScenarioList();
        LiveSim.previewItem(LiveSim.current());
        LiveSim.saveConfig({ quiet: false });
    },

    sendComment() {
        const text = $('#commentInput').val().trim();
        if (!text) return;
        LiveSim.addComment('you', text);
        $('#commentInput').val('');
    },

    addComment(user, message) {
        const $line = $(`<div class="comment-in bg-black/40 rounded-xl px-3 py-1.5 text-xs leading-snug w-fit max-w-full">
            <span class="font-bold text-gold">${Helpers.escapeHtml(user)}</span> <span class="text-white/90">${Helpers.escapeHtml(message)}</span>
        </div>`);
        $('#commentsFeed').append($line);
        while ($('#commentsFeed').children().length > 6) $('#commentsFeed').children().first().remove();
    },

    applyViewerActivity(viewer, action = 'joined') {
        const safeViewer = viewer || {};
        const normalizedAction = action === 'left' ? 'left' : 'joined';
        const rosterKey = String(safeViewer.name || '').trim().toLowerCase();
        if (normalizedAction === 'joined') {
            if (!rosterKey || LiveSim.viewerRoster.has(rosterKey)) return;
            LiveSim.viewerRoster.add(rosterKey);
            LiveSim.viewerLeftLog.delete(rosterKey);
            LiveSim.viewers += 1;
        } else {
            if (!rosterKey || LiveSim.viewerLeftLog.has(rosterKey)) return;
            if (LiveSim.viewerRoster.has(rosterKey)) LiveSim.viewerRoster.delete(rosterKey);
            LiveSim.viewerLeftLog.add(rosterKey);
            LiveSim.viewers = Math.max(0, LiveSim.viewers - 1);
        }
        $('#viewerCount').text(LiveSim.viewers);
        LiveSim.joinToast(safeViewer.name, safeViewer.pfp_url, normalizedAction);
    },

    joinToast(name, pfpUrl = '', action = 'joined') {
        const label = action === 'left' ? 'left' : 'joined';
        const avatar = String(pfpUrl || '').trim()
            ? `<img src="${Helpers.escapeHtml(pfpUrl)}" alt="" class="w-5 h-5 rounded-full object-cover" />`
            : `<span class="w-5 h-5 rounded-full bg-gold text-ink flex items-center justify-center text-[9px] font-bold">${Helpers.escapeHtml(String(name || '?').slice(0, 1).toUpperCase())}</span>`;
        const color = action === 'left' ? 'text-white/70' : 'text-white';
        const $toast = $(`<div class="join-toast text-[11px] font-medium bg-black/40 rounded-full pl-1 pr-2.5 py-1 inline-flex items-center gap-1.5">${avatar}<span class="${color}">${Helpers.escapeHtml(name)} ${label}</span></div>`);
        $('#joinToastArea').append($toast);
        setTimeout(() => $toast.remove(), 3200);
    },

    countdown(value) {
        $('#countdownOverlay').html(`<span class="count-pulse font-display text-white text-8xl" style="text-shadow:0 8px 30px rgba(0,0,0,.6)">${value}</span>`);
        setTimeout(() => $('#countdownOverlay').empty(), 950);
    },

    heart() {
        const $heart = $('<div>').text('<3').css({
            position: 'absolute', right: '24px', bottom: '170px',
            fontSize: '20px', zIndex: 25, transition: 'all 1.2s ease'
        });
        $('#phoneScreen').append($heart);
        requestAnimationFrame(() => $heart.css({ transform: 'translateY(-220px) translateX(-10px)', opacity: '0' }));
        setTimeout(() => $heart.remove(), 1300);
    },

    toggleFollow() {
        const following = $('#followBtn').text() === 'Follow';
        $('#followBtn').text(following ? 'Following' : 'Follow')
            .toggleClass('bg-hype', !following)
            .toggleClass('bg-surface2', following);
    },

    toggleControlPanel(force) {
        const open = force !== undefined ? force : !$('#controlPanel').hasClass('open');
        $('#controlPanel').toggleClass('open', open);
        $('#panelBackdrop').toggleClass('hidden', !open);
    },

    enterContentMode() {
        $('#mainNav, #controlPanel').addClass('hidden');
        $('#liveWrap').addClass('content-mode');
        $('#exitContentBtn').removeClass('hidden').addClass('flex');
        $('#view-live').addClass('!py-0');
        window.scrollTo({ top: 0 });
    },

    exitContentMode() {
        $('#mainNav, #controlPanel').removeClass('hidden');
        $('#liveWrap').removeClass('content-mode');
        $('#exitContentBtn').addClass('hidden').removeClass('flex');
        $('#view-live').removeClass('!py-0');
    },

    log(text) {
        $('#eventLog').append(`<div>${Helpers.escapeHtml(text)}</div>`);
        const el = $('#eventLog')[0];
        el.scrollTop = el.scrollHeight;
    }
};

$(async () => {
    await LiveSim.init();
});
