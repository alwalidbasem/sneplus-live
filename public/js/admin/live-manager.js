// Live session management (REST for CRUD; the actual live runs over sockets
// from the Live Viewer control panel).
const AdminLiveManager = {
    sessions: [],
    products: [],

    async load() {
        try {
            const [sessRes, prodRes] = await Promise.all([LiveAPI.list(), ProductAPI.list()]);
            AdminLiveManager.sessions = sessRes.data.sessions;
            AdminLiveManager.products = prodRes.data.products;
            AdminLiveManager.render();
        } catch (xhr) {
            Toast.show(API.errorText(xhr), 'error');
        }
    },

    render() {
        const $wrap = $('#sessionCards').empty();
        AdminLiveManager.sessions.forEach(async (s) => {
            const $card = $(`
                <div class="bg-surface border border-line rounded-2xl p-5">
                    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div>
                            <p class="font-semibold">#${s.id} — ${Helpers.escapeHtml(s.title)}</p>
                            <p class="text-[11px] text-muted">Host: ${Helpers.escapeHtml(s.host_name || '—')} · Peak viewers: ${s.viewer_peak}</p>
                        </div>
                        <span class="text-[10px] font-bold px-2 py-1 rounded-full ${s.status === 'live' ? 'bg-mint text-ink' : 'bg-surface2 text-muted'}">${s.status.toUpperCase()}</span>
                    </div>
                    <div class="items text-xs space-y-1 mb-3 text-muted"></div>
                    <div class="flex gap-2">
                        <a href="/live" class="flex-1 text-center py-2 rounded-xl bg-mint text-ink text-xs font-bold">Open control panel</a>
                    </div>
                </div>`);
            try {
                const res = await LiveAPI.getItems(s.id);
                const $items = $card.find('.items');
                res.data.items.forEach((i) => {
                    $items.append(`<div class="flex justify-between border-t border-line pt-1">
                        <span>${i.icon || '📦'} ${Helpers.escapeHtml(i.name)}</span>
                        <span class="capitalize">${i.status}</span>
                    </div>`);
                });
                if (!res.data.items.length) $items.append('<p>No items yet — add products in the Live Viewer panel.</p>');
            } catch (e) { /* ignore */ }
            $wrap.append($card);
        });
        if (!AdminLiveManager.sessions.length) {
            $wrap.append('<p class="text-sm text-muted">No live sessions yet.</p>');
        }
    },

    init() {
        $('#btnNewSession').on('click', async () => {
            const title = prompt('Live session title:');
            if (!title) return;
            try {
                await LiveAPI.create(title.trim());
                Toast.show('Session created', 'success');
                AdminLiveManager.load();
            } catch (xhr) {
                Toast.show(API.errorText(xhr), 'error');
            }
        });
    }
};
