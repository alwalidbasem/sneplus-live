// Bid + Buy Now UX. Validates input for fast feedback only — the server
// re-validates everything and is the only authority on who wins.
const Bidding = {
    currentItem: null,

    init() {
        $('#closeBidBtn').on('click', () => Modal.close('bidModal'));
        $('#closeBuyNowBtn').on('click', () => Modal.close('buyNowModal'));
        $('#bidInput').on('input', Bidding.validateInput);
        $('#bidInput').on('keydown', (ev) => { if (ev.key === 'Enter') Bidding.confirm(); });
        $('#confirmBidBtn').on('click', Bidding.confirm);
        $('#confirmBuyBtn').on('click', Bidding.confirmBuy);
        $('#bidBtn').on('click', Bidding.openForCurrentItem);

        $(document).on('bid:rejected', (e, error) => {
            if (Modal.isOpen('bidModal')) {
                $('#bidModalError').text(error.message).removeClass('hidden');
                $('#confirmBidBtn').prop('disabled', false);
            } else {
                Toast.show(error.message, 'error');
            }
        });
    },

    openForCurrentItem() {
        if (!Bidding.currentItem) return;
        if (Bidding.currentItem.saleType === 'buy_now') {
            Bidding.openBuyNow();
        } else {
            Bidding.openBid();
        }
    },

    openBid() {
        if (!App.user) {
            Toast.show('Log in to place a bid.', 'error');
            return;
        }
        const current = Bidding.currentItem.currentBid || 0;
        $('#modalCurrentBid').text('$' + current);
        $('#bidInput').val(current + 1);
        $('#bidModalError').addClass('hidden');
        $('#confirmBidBtn').prop('disabled', false);
        Modal.open('bidModal');
        setTimeout(() => { $('#bidInput').focus().select(); }, 50);
    },

    validateInput() {
        const current = Bidding.currentItem ? (Bidding.currentItem.currentBid || 0) : 0;
        const val = parseInt($('#bidInput').val(), 10);
        const invalid = !val || val <= current;
        $('#confirmBidBtn').prop('disabled', invalid);
        if (invalid) {
            $('#bidModalError').text(`Your bid must be higher than the current bid ($${current}).`).removeClass('hidden');
        } else {
            $('#bidModalError').addClass('hidden');
        }
        return !invalid;
    },

    async confirm() {
        if (!Bidding.validateInput()) return;
        $('#confirmBidBtn').prop('disabled', true);
        const ack = await LiveSocket.emit('bid:place', {
            liveItemId: Bidding.currentItem.id,
            amount: parseInt($('#bidInput').val(), 10)
        });
        if (ack.success) {
            Modal.close('bidModal');
            Toast.show('Bid placed!', 'success');
        } else {
            $('#confirmBidBtn').prop('disabled', false);
        }
    },

    openBuyNow() {
        if (!App.user) {
            Toast.show('Log in to buy.', 'error');
            return;
        }
        $('#buyNowItemName').text(Bidding.currentItem.name);
        $('#buyNowPrice').text('$' + Bidding.currentItem.staticPrice);
        Modal.open('buyNowModal');
    },

    async confirmBuy() {
        $('#confirmBuyBtn').prop('disabled', true);
        const ack = await LiveSocket.emit('buy-now:purchase', { liveItemId: Bidding.currentItem.id });
        $('#confirmBuyBtn').prop('disabled', false);
        Modal.close('buyNowModal');
        if (ack.success) {
            Toast.show('You got it! Order #' + ack.data.orderId, 'success');
        } else {
            Toast.show(ack.error.message, 'error');
        }
    }
};
