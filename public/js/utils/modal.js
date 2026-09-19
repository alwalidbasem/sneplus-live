// Generic modal helpers (Tailwind-based: hidden + flex toggling).
const Modal = {
    open(id) {
        const el = document.getElementById(id);
        if (!el || !el.classList.contains('hidden')) return;
        el.classList.remove('hidden');
        el.classList.add('flex');
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        // Focus the first focusable element inside the dialog for keyboard users.
        const $focusable = $(el).find('input, select, textarea, button').filter(':visible').first();
        if ($focusable.length) $focusable.trigger('focus');
    },
    close(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('hidden');
        el.classList.remove('flex');
        el.removeAttr('role').removeAttr('aria-modal');
    },
    isOpen(id) {
        const el = document.getElementById(id);
        return !!el && !el.classList.contains('hidden');
    },
    closeTop() {
        const open = $('.fixed.inset-0.flex').filter(':not(.hidden)').get();
        if (open.length) {
            Modal.close(open[open.length - 1].id);
            return true;
        }
        return false;
    }
};

// ESC closes the topmost open modal.
$(document).on('keydown.modalEsc', (e) => {
    if (e.key === 'Escape' && Modal.closeTop()) e.stopPropagation();
});
