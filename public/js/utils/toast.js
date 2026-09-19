// Toast notifications (top-right stack, auto-dismiss).
const Toast = {
    show(message, type = 'info') {
        const colors = {
            info: 'bg-surface border-line',
            error: 'bg-alert border-alertdark',   // Alert #B00020 — brand error color
            success: 'bg-mint text-ink border-mint'
        };
        const $t = $('<div>')
            .addClass('fixed top-20 right-4 z-[80] px-4 py-3 rounded-xl text-sm font-semibold shadow-lg max-w-xs ' + (colors[type] || colors.info))
            .text(message);
        // Announce to screen readers; errors assertively.
        if (type === 'error') {
            $t.attr({ role: 'alert', 'aria-live': 'assertive' });
        } else {
            $t.attr({ role: 'status', 'aria-live': 'polite' });
        }
        $('body').append($t);
        setTimeout(() => $t.fadeOut(300, () => $t.remove()), 3200);
    }
};
