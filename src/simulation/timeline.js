// Sneplus Live — single source of truth for simulation timelines.
// Shared by the simulator UI, the live viewer, and the automated tests.
// UMD: works as a Node module and as a browser global (window.SneplusSim).
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SneplusSim = api;
})(typeof self !== 'undefined' ? self : this, function () {

    const EVENT_PRIORITY = {
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

    function num(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function text(value, max = 500) {
        return String(value ?? '').trim().slice(0, max);
    }

    function normalizeJoins(joins = []) {
        return (Array.isArray(joins) ? joins : [])
            .map((join) => {
                const rawAction = text(join.action || join.event || join.type || 'joined', 20).toLowerCase();
                return {
                    after: Math.max(0, num(join.after, 0)),
                    action: ['left', 'leave', 'leaved'].includes(rawAction) ? 'left' : 'joined',
                    name: text(join.name, 120),
                    pfp_url: text(join.pfp_url || join.pfpUrl, 1000)
                };
            })
            .filter((join) => join.name)
            .sort((a, b) => a.after - b.after);
    }

    function normalizeViewerUpdates(updates = []) {
        return (Array.isArray(updates) ? updates : [])
            .map((update) => ({
                after: Math.max(0, num(update.after, 0)),
                viewers: Math.max(0, Math.floor(num(update.viewers, 0)))
            }))
            .sort((a, b) => a.after - b.after);
    }

    function normalizeComments(comments = []) {
        return (Array.isArray(comments) ? comments : [])
            .map((comment) => ({
                after: Math.max(0, num(comment.after, 0)),
                name: text(comment.name || comment.user, 120),
                comment: text(comment.comment || comment.text, 300)
            }))
            .filter((comment) => comment.name && comment.comment)
            .sort((a, b) => a.after - b.after);
    }

    function normalizeBids(bids = [], names = []) {
        return (Array.isArray(bids) ? bids : [])
            .map((bid, index) => {
                if (typeof bid === 'number') {
                    const fallbackName = names[index % names.length] || `Bidder ${index + 1}`;
                    return { after: 7 + index * 5, bid_amount: bid, bidder_username: fallbackName, name: fallbackName };
                }
                const name = text(bid.bidder_username || bid.name, 120) || (names[index % names.length] || `Bidder ${index + 1}`);
                return {
                    after: Math.max(0, num(bid.after, 0)),
                    bid_amount: num(bid.bid_amount, 0),
                    bidder_username: name,
                    name
                };
            })
            .filter((bid) => bid.bid_amount > 0)
            .sort((a, b) => a.after - b.after);
    }

    function repairBidSequence(bids = [], start = 0) {
        let previous = Math.max(0, num(start, 0));
        return normalizeBids(bids).map((bid) => {
            const amount = bid.bid_amount > previous ? bid.bid_amount : previous + 1;
            previous = amount;
            return { ...bid, bid_amount: amount };
        });
    }

    function sortEvents(events) {
        return events
            .map((event, index) => ({ ...event, _order: index }))
            .sort((a, b) => a.t - b.t || (EVENT_PRIORITY[a.type] ?? 50) - (EVENT_PRIORITY[b.type] ?? 50) || a._order - b._order)
            .map(({ _order, ...event }) => event);
    }

    // Builds the deterministic event timeline for one product/scenario.
    // All "after" times are absolute seconds from live start.
    // liveNow shifts the product/auction schedule when starting mid-live.
    function buildEvents(item, liveNow = 0) {
        const events = [];
        const t0 = Math.max(0, num(item.startAfter, 0) - Math.max(0, num(liveNow, 0)));
        const auctionAt = t0 + Math.max(0, num(item.auctionStartAfter, 0));
        const start = num(item.start, 1);

        events.push({ t: 0, type: 'VIEWER_UPDATE', viewers: Math.max(0, Math.floor(num(item.initialViewers, 1))) });
        events.push({ t: t0, type: 'PRODUCT_START' });
        normalizeJoins(item.joins).forEach((join) => {
            events.push({ t: join.after, type: join.action === 'left' ? 'VIEWER_ACTIVITY' : 'VIEWER_JOIN', action: join.action, viewer: join });
        });
        normalizeViewerUpdates(item.viewerUpdates).forEach((update) => {
            events.push({ t: update.after, type: 'VIEWER_UPDATE', viewers: update.viewers });
        });
        normalizeComments(item.comments).forEach((comment) => {
            events.push({ t: comment.after, type: 'COMMENT', user: comment.name, text: comment.comment });
        });

        if (item.type === 'buynow') {
            events.push({ t: auctionAt, type: 'BUYNOW_START', amount: start });
            events.push({ t: auctionAt + 16, type: 'VIEWER_BUY', user: 'Omar' });
            return sortEvents(events);
        }

        const bids = normalizeBids(item.bids);
        events.push({ t: auctionAt, type: 'AUCTION_START', amount: start, duration: num(item.bidDuration, 30) });
        bids.forEach((bid) => {
            events.push({ t: bid.after, type: 'BID', amount: bid.bid_amount, user: bid.bidder_username });
        });

        const lastBidAt = Math.max(auctionAt, ...bids.map((bid) => bid.after));
        const duration = Math.max(num(item.bidDuration, 30), lastBidAt - auctionAt + 3);
        const end = auctionAt + duration;
        const requested = num(item.countdownAt, 0);
        let countdownAt;
        if (requested > auctionAt && requested <= end - 3) {
            countdownAt = requested;
        } else {
            countdownAt = Math.max(end - 3, auctionAt + 1);
        }
        events.find((event) => event.type === 'AUCTION_START').duration = duration;
        events.push({ t: countdownAt, type: 'COUNTDOWN', value: 3 });
        events.push({ t: countdownAt + 1, type: 'COUNTDOWN', value: 2 });
        events.push({ t: countdownAt + 2, type: 'COUNTDOWN', value: 1 });
        events.push({ t: end, type: 'AUCTION_END' });
        return sortEvents(events);
    }

    // Returns a list of human-readable problems. Empty array = valid scenario.
    function validateTimeline(item = {}) {
        const issues = [];
        if (!item || item.type !== 'auction') return issues;

        const startAfter = Math.max(0, num(item.startAfter, 0));
        const auctionAt = startAfter + Math.max(0, num(item.auctionStartAfter, 0));
        const bids = normalizeBids(item.bids);
        const lastBidAt = Math.max(auctionAt, ...bids.map((bid) => bid.after));
        const duration = Math.max(num(item.bidDuration, 30), lastBidAt - auctionAt + 3);
        const end = auctionAt + duration;

        bids.forEach((bid) => {
            if (bid.after < auctionAt) {
                issues.push(`Bid "$${bid.bid_amount}" at ${bid.after}s happens before auction start (${auctionAt}s).`);
            }
        });

        const byTime = new Map();
        bids.forEach((bid) => {
            const key = String(bid.after);
            if (byTime.has(key) && byTime.get(key) !== bid.bid_amount) {
                issues.push(`Conflicting bids scheduled at the same second (${bid.after}s).`);
            }
            byTime.set(key, bid.bid_amount);
        });

        for (let i = 1; i < bids.length; i += 1) {
            if (bids[i].bid_amount <= bids[i - 1].bid_amount) {
                issues.push(`Bid amounts must increase: "$${bids[i].bid_amount}" at ${bids[i].after}s is not higher than "$${bids[i - 1].bid_amount}".`);
            }
        }

        const countdownAt = num(item.countdownAt, 0);
        if (countdownAt > 0 && countdownAt < auctionAt) {
            issues.push(`Countdown at ${countdownAt}s happens before auction start (${auctionAt}s).`);
        }

        if (bids.length && lastBidAt >= end) {
            issues.push(`Auction ends at ${end}s before the final bid at ${lastBidAt}s. Increase auction duration.`);
        }

        return issues;
    }

    // Normalizes a raw product/scenario object into the canonical stored shape.
    function normalizeScenario(product = {}) {
        product = product && typeof product === 'object' ? product : {};
        const type = product.type === 'buynow' ? 'buynow' : 'auction';
        const start = Math.max(1, num(product.start, 1));
        const bids = repairBidSequence(product.bids, start);
        const startAfter = Math.max(0, num(product.startAfter, 0));
        const auctionStartAfter = Math.max(0, num(product.auctionStartAfter, 0));
        const bidDuration = Math.max(5, num(product.bidDuration, 30), ...bids.map((bid) => bid.after - (startAfter + auctionStartAfter) + 3));
        const rawCountdown = product.countdownAt;
        const countdownAt = rawCountdown === undefined || rawCountdown === null || num(rawCountdown, 0) <= 0
            ? null
            : Math.max(0, Math.floor(num(rawCountdown, 0)));
        return {
            name: text(product.name, 200) || 'Untitled product',
            icon: text(product.icon, 4) || 'IT',
            imageUrl: text(product.imageUrl || product.image_url, 1000),
            category: text(product.category, 80) || 'Other',
            type,
            start,
            initialViewers: Math.max(0, Math.floor(num(product.initialViewers, 1))),
            startAfter,
            auctionStartAfter,
            bidDuration,
            countdownAt,
            joins: normalizeJoins(product.joins),
            viewerUpdates: normalizeViewerUpdates(product.viewerUpdates),
            comments: normalizeComments(product.comments),
            bids: type === 'auction' ? bids : [],
            status: 'pending'
        };
    }

    class TimelineRunner {
        constructor(events) {
            this.events = sortEvents(events);
            this.fired = 0;
            this.paused = false;
            this.executed = [];
        }

        advanceTo(seconds) {
            if (this.paused) return [];
            const batch = [];
            while (this.fired < this.events.length && this.events[this.fired].t <= seconds) {
                batch.push(this.events[this.fired]);
                this.executed.push(this.events[this.fired]);
                this.fired += 1;
            }
            return batch;
        }

        pause() {
            this.paused = true;
        }

        resume() {
            this.paused = false;
        }

        restart() {
            this.fired = 0;
            this.paused = false;
            this.executed = [];
        }
    }

    return {
        EVENT_PRIORITY,
        buildEvents,
        normalizeBids,
        repairBidSequence,
        normalizeJoins,
        normalizeViewerUpdates,
        normalizeComments,
        normalizeScenario,
        sortEvents,
        validateTimeline,
        TimelineRunner
    };
});
