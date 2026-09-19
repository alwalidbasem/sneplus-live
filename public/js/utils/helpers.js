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
    },

    // Floating heart reaction: spawns the element at the heart button's
    // position inside #phoneScreen with randomized sway/rise/rotation/duration.
    // The element removes itself when the animation (and fade-out) finishes.
    heartFloat($el) {
        const $screen = $('#phoneScreen');
        const $btn = $('#sendHeartBtn');

        if ($btn.length && $screen.length) {
            // Start from the center of the heart button, in the screen's
            // coordinate space (getBoundingClientRect handles any transform)
            const s = $screen[0].getBoundingClientRect();
            const b = $btn[0].getBoundingClientRect();
            const scale = (s.width && $screen[0].offsetWidth) ? s.width / $screen[0].offsetWidth : 1;
            const startX = (b.left + b.width / 2 - s.left) / scale;
            const startY = (b.top + b.height / 2 - s.top) / scale;

            // Randomized movement: alternating right/left sway with random
            // amplitude, random rise height and random rotation per step
            const swayAmp = 8 + Math.random() * 14;
            const sway = [1, -1, 1, -1, 1, -1].map(
                (sign) => +(sign * swayAmp * (0.55 + Math.random() * 0.9)).toFixed(1)
            );
            const vars = { '--rise': `${(200 + Math.random() * 100).toFixed(0)}px` };
            sway.forEach((v, i) => {
                vars[`--sway-${i + 1}`] = `${v}px`;
                vars[`--rot-${i + 1}`] = `${+(v * 0.6).toFixed(1)}deg`;
            });

            $screen.append($el);
            // Small random horizontal offset so overlapping hearts don't stack
            const jitterX = (Math.random() - 0.5) * 24;
            const w = $el.outerWidth() || 20;
            const h = $el.outerHeight() || 24;
            $el.css({
                left: `${(startX + jitterX - w / 2).toFixed(1)}px`,
                top: `${(startY - h / 2).toFixed(1)}px`,
                'animation-duration': `${(2.1 + Math.random() * 0.9).toFixed(2)}s`
            });
            const style = $el[0].style;
            Object.keys(vars).forEach((k) => style.setProperty(k, vars[k]));
        } else {
            // Fallback: fixed position if button/screen not found
            $el.css({ right: '24px', bottom: '170px' });
            $screen.append($el);
        }

        $el.addClass('heart-float');
        // Remove the element once the fade-out animation finishes
        $el.one('animationend', () => $el.remove());
        // Safety cleanup in case animationend never fires
        setTimeout(() => $el.remove(), 4000);
    }
};
