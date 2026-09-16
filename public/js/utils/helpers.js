const Helpers = {
    escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    money(value) {
        return value === null || value === undefined ? '—' : '$' + Number(value);
    },

    timeAgo(iso) {
        if (!iso) return '';
        const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (s < 60) return s + 's ago';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        return new Date(iso).toLocaleDateString();
    },

    isAdmin(user) {
        return !!user && ['admin', 'host'].includes(user.role);
    },

    // Renders a countdown from a future timestamp; calls onZero once.
    startCountdown(endsAt, onTick, onZero) {
        const end = new Date(endsAt).getTime();
        let handle = null;
        const tick = () => {
            const remain = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            onTick(remain);
            if (remain <= 0) {
                clearInterval(handle);
                if (onZero) onZero();
            }
        };
        tick();
        handle = setInterval(tick, 1000);
        return () => clearInterval(handle);
    }
};
