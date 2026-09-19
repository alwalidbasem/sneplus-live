// Shared page behavior: nav highlighting, JSON i18n, auth badge.
const App = {
    user: null,
    lang: localStorage.getItem('sneplus_lang') || 'en',
    messages: {},

    async init({ navActive = null } = {}) {
        // Inject shared components (navbar, footer) before any nav logic runs.
        if (typeof Components !== 'undefined') {
            await Components.mount();
        }
        await App.loadI18n();
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
        App.applyI18n();
        $('.nav-lang-btn').off('click').on('click', () => App.toggleLang());
        $('.nav-auth-btn').text(App.user ? App.t('common.auth.logout') : App.t('common.auth.login')).off('click').on('click', async () => {
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
        App.initNavOffcanvas();
    },

    initNavOffcanvas() {
        const $drawer = $('#navOffcanvas');
        if (!$drawer.length) return;
        const open = () => {
            $drawer.addClass('open').attr('aria-hidden', 'false');
            $('#navOverlay').addClass('open');
            $('#navMenuBtn').attr('aria-expanded', 'true');
            $('body').addClass('nav-open');
        };
        const close = () => {
            $drawer.removeClass('open').attr('aria-hidden', 'true');
            $('#navOverlay').removeClass('open');
            $('#navMenuBtn').attr('aria-expanded', 'false');
            $('body').removeClass('nav-open');
        };
        $('#navMenuBtn').off('click').on('click', open);
        $('#navCloseBtn').off('click').on('click', close);
        $('#navOverlay').off('click').on('click', close);
        $(document).off('keydown.navoc').on('keydown.navoc', (e) => {
            if (e.key === 'Escape') close();
        });
        $drawer.find('a').off('click').on('click', close);
    },

    async loadI18n() {
        try {
            const res = await fetch('/i18n/' + App.lang + '.json', { cache: 'no-store' });
            App.messages = await res.json();
        } catch (e) {
            App.messages = {};
        }
    },

    t(path, fallback = '') {
        const value = String(path).split('.').reduce((obj, key) => (
            obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined
        ), App.messages);
        return value === undefined || value === null ? fallback || path : value;
    },

    applyI18n(root = document) {
        const dir = App.lang === 'ar' ? 'rtl' : 'ltr';
        $('html').attr({ lang: App.lang, dir });
        $('body').toggleClass('ar-font', App.lang === 'ar');
        $('[data-i18n]', root).each(function () {
            const $el = $(this);
            $el.text(App.t($el.data('i18n'), $el.text()));
        });
        $('[data-i18n-html]', root).each(function () {
            const $el = $(this);
            $el.html(App.t($el.data('i18n-html'), $el.html()));
        });
        $('[data-i18n-placeholder]', root).each(function () {
            const $el = $(this);
            $el.attr('placeholder', App.t($el.data('i18n-placeholder'), $el.attr('placeholder')));
        });
        $('[data-i18n-title]', root).each(function () {
            const $el = $(this);
            $el.attr('title', App.t($el.data('i18n-title'), $el.attr('title')));
        });
        document.documentElement.classList.remove('i18n-pending');
        $('.nav-lang-btn').text(App.t('common.language.toggle'));
    },

    async setLang(lang) {
        App.lang = lang;
        localStorage.setItem('sneplus_lang', App.lang);
        await App.loadI18n();
        App.applyI18n();
        $('.nav-auth-btn').text(App.user ? App.t('common.auth.logout') : App.t('common.auth.login'));
        $(document).trigger('sneplus:lang', [App.lang]);
    },

    toggleLang() {
        return App.setLang(App.lang === 'en' ? 'ar' : 'en');
    }
};