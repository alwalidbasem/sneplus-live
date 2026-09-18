function normalizeBids(bids = []) {
    return bids
        .map((bid, index) => (typeof bid === 'number'
            ? { after: 7 + index * 5, bid_amount: bid, bidder_username: `Bidder ${index + 1}` }
            : {
                after: Math.max(0, Number(bid.after) || 0),
                bid_amount: Number(bid.bid_amount),
                bidder_username: String(bid.bidder_username || bid.name || `Bidder ${index + 1}`)
            }))
        .filter((bid) => bid.bid_amount > 0)
        .sort((a, b) => a.after - b.after);
}

function sortEvents(events) {
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
}

function buildEvents(item, liveNow = 0) {
    const events = [];
    const t0 = Math.max(0, (Number(item.startAfter) || 0) - liveNow);
    const auctionAt = t0 + Math.max(0, Number(item.auctionStartAfter) || 0);
    const bids = normalizeBids(item.bids);

    events.push({ t: 0, type: 'VIEWER_UPDATE', viewers: Math.max(0, Number(item.initialViewers) || 1) });
    events.push({ t: t0, type: 'PRODUCT_START' });
    events.push({ t: auctionAt, type: 'AUCTION_START', amount: Number(item.start) || 1, duration: Number(item.bidDuration) || 30 });
    bids.forEach((bid) => {
        events.push({ t: bid.after, type: 'BID', amount: bid.bid_amount, user: bid.bidder_username });
    });

    const lastBidAt = Math.max(auctionAt, ...bids.map((bid) => bid.after));
    const duration = Math.max(Number(item.bidDuration) || 30, lastBidAt - auctionAt + 3);
    const end = auctionAt + duration;
    const countdownAt = Math.min(end - 3, Number.isFinite(Number(item.countdownAt)) ? Number(item.countdownAt) : end - 3);
    events.find((event) => event.type === 'AUCTION_START').duration = duration;
    events.push({ t: countdownAt, type: 'COUNTDOWN', value: 3 });
    events.push({ t: countdownAt + 1, type: 'COUNTDOWN', value: 2 });
    events.push({ t: countdownAt + 2, type: 'COUNTDOWN', value: 1 });
    events.push({ t: end, type: 'AUCTION_END' });
    return sortEvents(events);
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

module.exports = { buildEvents, normalizeBids, sortEvents, TimelineRunner };
