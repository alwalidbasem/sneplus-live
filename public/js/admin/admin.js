// Admin console shell: auth guard + tab switching.
$(async () => {
    await App.init({ navActive: 'admin' });

    if (!Helpers.isAdmin(App.user)) {
        $('#adminGuard').removeClass('hidden');
        $('#adminContent').addClass('hidden');
        return;
    }
    $('#adminContent').removeClass('hidden');

    AdminProducts.init();
    await Promise.all([
        AdminDashboard.load(),
        AdminProducts.load()
    ]);

    $('[data-tab]').on('click', function () {
        const tab = $(this).data('tab');
        $('[data-tab]').removeClass('bg-hype');
        $(this).addClass('bg-hype');
        $('#tab-dashboard, #tab-products, #tab-simulator').addClass('hidden');
        $('#tab-' + tab).removeClass('hidden');
    });
});
