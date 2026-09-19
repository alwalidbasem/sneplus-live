// Runs before render: applies the saved language direction immediately and
// hides the page until translations are applied (prevents the EN flash on reload).
(function () {
    var lang = localStorage.getItem('sneplus_lang') || 'en';
    var de = document.documentElement;
    de.setAttribute('lang', lang);
    de.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    if (lang === 'ar') {
        de.classList.add('i18n-pending');
    }
})();