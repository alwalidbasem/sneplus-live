// Shared page behavior: nav highlighting, language toggle, auth badge.
const App = {
    user: null,
    lang: localStorage.getItem('sneplus_lang') || 'en',

    async init({ navActive = null } = {}) {
        try {
            if (typeof AuthAPI !== 'undefined') {
                const res = await AuthAPI.me();
                App.user = res.data.user;
            }
        } catch (e) {
            App.user = null;
        }
        if (navActive) {
            $('[data-nav="' + navActive + '"]').addClass('bg-surface text-white');
        }
        $('#navAuthBtn').text(App.user ? 'Log out' : 'Log in').off('click').on('click', async () => {
            if (App.user && typeof AuthAPI !== 'undefined') {
                await AuthAPI.logout().catch(() => {});
                location.href = '/';
                return;
            }
            const next = encodeURIComponent(location.pathname + location.search);
            location.href = '/login?next=' + next;
        });
        if (App.user && $('#navUserName').length) {
            $('#navUserName').text(App.user.name).removeClass('hidden');
        }
    },

    toggleLang() {
        App.lang = App.lang === 'en' ? 'ar' : 'en';
        localStorage.setItem('sneplus_lang', App.lang);
        $(document).trigger('sneplus:lang', [App.lang]);
    }
};
