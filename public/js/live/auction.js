// Auction UI: item card, countdown, winner/unsold overlays. Pure display —
// winners are decided by the server (winner:selected / product:unsold events).
const AuctionUI = {
    stopCountdown: null,

    init() {
        $(document).on('item:started', (e, item) => AuctionUI.renderItem(item));
        $(document).on('item:ended', (e, item) => AuctionUI.renderItem(item));
        $(document).on('bid:new', (e, payload) => AuctionUI.onNewBid(payload));
        $(document).on('winner:selected', (e, payload) => AuctionUI.showWinner(payload));
        $(document).on('product:unsold', () => AuctionUI.showUnsold());
        $(document).on('buy-now:sold', (e, payload) => AuctionUI.showBuyNowSold(payload));
        $(document).on('auction:ended', () => AuctionUI.stopTimer());
    },

    stopTimer() {
        if (AuctionUI.stopCountdown) { AuctionUI.stopCountdown(); AuctionUI.stopCountdown = null; }
    },

    renderItem(item) {
        Bidding.currentItem = item;
        if (!item) {
            $('#productArea').addClass('hidden');
            return;
        }
        $('#waitingState').addClass('hidden');
        $('#productArea').removeClass('hidden');
        $('#productIcon').text(item.icon || '📦');
        $('#productName').text(item.name);
        $('#productCategory').text(item.category || '');

        const $btn = $('#bidBtn').prop('disabled', false);
        if (item.saleType === 'buy_now') {
            $('#bidLabel').text('Buy it now');
            $('#currentBid').text('$' + item.staticPrice);
            $btn.text(`Buy Now $${item.staticPrice}`);
            $('#statusPill').text(item.status === 'active' ? 'Buy it now — first taker wins' : item.status);
            $('#bidTimer').addClass('hidden');
        } else {
            $('#bidLabel').text(item.status === 'active' ? 'Current bid' : 'Starting at');
            $('#currentBid').text('$' + (item.currentBid ?? item.startPrice));
            $btn.text('Bid');
            $('#statusPill').text(item.status === 'active' ? 'Auction live' : item.status);
            if (item.status === 'active' && item.auctionEndsAt) {
                AuctionUI.startTimer(item.auctionEndsAt);
            } else {
                $('#bidTimer').addClass('hidden');
            }
        }
        if (item.status !== 'active') $btn.prop('disabled', true);
    },

    startTimer(endsAt) {
        AuctionUI.stopTimer();
        $('#bidTimer').removeClass('hidden');
        AuctionUI.stopCountdown = Helpers.startCountdown(
            endsAt,
            (remain) => $('#bidTimer').text(`⏱ ${remain}s`),
            () => $('#bidTimer').text('⏱ 0s')
        );
    },

    onNewBid(payload) {
        if (Bidding.currentItem && Bidding.currentItem.id === payload.liveItemId) {
            Bidding.currentItem.currentBid = payload.currentBid;
        }
        $('#currentBid').text('$' + payload.currentBid);
        $('#currentBid').addClass('bid-flash');
        setTimeout(() => $('#currentBid').removeClass('bid-flash'), 500);
        $('#winningLine').removeClass('hidden')
            .text(`🔥 Highest bid: ${payload.highestBidder} — $${payload.currentBid}`);
    },

    showWinner(payload) {
        AuctionUI.stopTimer();
        $('#winningLine').addClass('hidden');
        const $ov = $('#endOverlay').empty().removeClass('hidden').addClass('flex');
        $ov.append(`
            <div class="fade-up">
                <div class="text-4xl mb-2">🏆</div>
                <p class="font-display text-2xl mb-1">Sold!</p>
                <p class="text-sm text-muted mb-1">Winner</p>
                <p class="font-bold text-lg text-gold">${Helpers.escapeHtml(payload.winnerName)}</p>
                <p class="font-display text-3xl mt-2">$${payload.finalPrice}</p>
            </div>`);
        setTimeout(() => $ov.addClass('hidden').removeClass('flex'), 4000);
    },

    showBuyNowSold(payload) {
        const $ov = $('#endOverlay').empty().removeClass('hidden').addClass('flex');
        $ov.append(`
            <div class="fade-up">
                <div class="text-4xl mb-2">🛒</div>
                <p class="font-display text-2xl mb-1">Sold!</p>
                <p class="text-sm text-muted">Bought by <span class="text-gold font-bold">${Helpers.escapeHtml(payload.winnerName)}</span> for $${payload.price}</p>
            </div>`);
        setTimeout(() => $ov.addClass('hidden').removeClass('flex'), 4000);
    },

    showUnsold() {
        AuctionUI.stopTimer();
        $('#winningLine').addClass('hidden');
        $('#bidBtn').prop('disabled', true);
        $('#statusPill').text('Unsold');
        Toast.show('Item ended unsold.', 'info');
    }
};
