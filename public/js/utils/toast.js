// Toast notifications (top-right stack, auto-dismiss).
const Toast = {
    show(message, type = 'info') {
        const colors = {
            info: 'bg-surface border-line',
            error: 'bg-hype border-hypedark',
            success: 'bg-mint text-ink border-mint'
        };
        const $t = $('<div>')
            .addClass('fixed top-20 right-4 z-[80] px-4 py-3 rounded-xl text-sm font-semibold shadow-lg max-w-xs ' + (colors[type] || colors.info))
            .text(message);
        $('body').append($t);
        setTimeout(() => $t.fadeOut(300, () => $t.remove()), 3200);
    }
};
