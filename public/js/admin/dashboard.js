// Admin dashboard: real waitlist analytics from PostgreSQL.
const AdminDashboard = {
    async load() {
        try {
            const res = await API.get('/api/admin/dashboard');
            const d = res.data;
            const stats = d.waitlistStats || {};

            $('#statWaitlist').text(stats.total || 0);
            $('#statBuyers').text(stats.buyer || 0);
            $('#statSellers').text(stats.seller || 0);
            $('#statCreators').text(stats.creator || 0);

            AdminDashboard.renderBars('#countryBars', d.waitlistCountries || []);
            AdminDashboard.renderBars('#categoryBars', d.waitlistCategories || []);
            AdminDashboard.renderDays(d.waitlistDays || []);
            AdminDashboard.renderWaitlist(d.latestWaitlist || []);
        } catch (xhr) {
            Toast.show(API.errorText(xhr), 'error');
        }
    },

    renderBars(sel, rows) {
        const max = Math.max(1, ...rows.map((r) => Number(r.count)));
        $(sel).html(rows.map((r) => `
            <div>
                <div class="flex justify-between text-xs mb-1">
                    <span>${Helpers.escapeHtml(r.label)}</span>
                    <span class="font-numeric text-muted">${r.count}</span>
                </div>
                <div class="h-2 bg-ink2 rounded-full overflow-hidden">
                    <div class="h-full bg-hype bar-fill" style="width:${Math.round((Number(r.count) / max) * 100)}%"></div>
                </div>
            </div>`).join('') || '<p class="text-sm text-muted">No data yet.</p>');
    },

    renderDays(rows) {
        const byDay = {};
        rows.forEach((r) => { byDay[r.day] = Number(r.count); });
        const days = [];
        for (let i = 6; i >= 0; i -= 1) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push({ day: key, count: byDay[key] || 0 });
        }
        const max = Math.max(1, ...days.map((d) => d.count));
        $('#dayChart').html(days.map((d) => `
            <div class="flex-1 h-full flex flex-col justify-end gap-2 min-w-0">
                <div class="bg-gold rounded-t-md min-h-[4px]" style="height:${Math.max(4, Math.round((d.count / max) * 100))}%"></div>
                <div class="font-numeric text-[10px] text-muted text-center truncate">${d.day.slice(5)}</div>
                <div class="font-numeric text-[10px] text-center font-semibold">${d.count}</div>
            </div>`).join(''));
    },

    renderWaitlist(rows) {
        const $wl = $('#wlTable').empty();
        rows.forEach((e) => {
            $wl.append(`<tr class="border-t border-line">
                <td class="py-2 pr-2">${Helpers.escapeHtml(e.name)}</td>
                <td class="py-2 pr-2 text-muted">${Helpers.escapeHtml(e.country)}</td>
                <td class="py-2 pr-2 capitalize">${Helpers.escapeHtml(e.user_type)}</td>
                <td class="py-2 pr-2 text-muted">${Helpers.escapeHtml(e.category)}</td>
                <td class="py-2 pr-2 text-muted uppercase">${Helpers.escapeHtml(e.language)}</td>
                <td class="font-numeric py-2 pr-2 text-muted">${new Date(e.created_at).toLocaleDateString()}</td>
            </tr>`);
        });
        if (!rows.length) {
            $wl.append('<tr><td colspan="6" class="py-4 text-muted">No waitlist registrations yet.</td></tr>');
        }
    }
};
