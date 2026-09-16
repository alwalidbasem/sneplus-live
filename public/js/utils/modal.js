// Generic modal helpers (Tailwind-based: hidden + flex toggling).
const Modal = {
    open(id) {
        const el = document.getElementById(id);
        el.classList.remove('hidden');
        el.classList.add('flex');
    },
    close(id) {
        const el = document.getElementById(id);
        el.classList.add('hidden');
        el.classList.remove('flex');
    },
    isOpen(id) {
        return !document.getElementById(id).classList.contains('hidden');
    }
};
