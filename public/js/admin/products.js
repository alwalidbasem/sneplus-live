// Product catalog CRUD (REST). The image upload uses the same multipart
// endpoint; the server validates MIME/extension/size.
const AdminProducts = {
    products: [],
    editingId: null,

    async load() {
        try {
            const res = await ProductAPI.list();
            AdminProducts.products = res.data.products;
            AdminProducts.render();
        } catch (xhr) {
            Toast.show(API.errorText(xhr), 'error');
        }
    },

    render() {
        const $wrap = $('#productCards').empty();
        AdminProducts.products.forEach((p) => {
            const isAuction = p.sale_type === 'auction';
            const $card = $(`
                <div class="bg-surface border border-line rounded-2xl p-5">
                    <div class="flex items-start gap-3 mb-3">
                        <div class="w-12 h-12 rounded-xl bg-ink2 flex items-center justify-center text-2xl shrink-0">${p.icon || '📦'}</div>
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold truncate">${Helpers.escapeHtml(p.name)}</p>
                            <p class="text-[11px] text-muted">${Helpers.escapeHtml(p.category || '')}</p>
                        </div>
                        <span class="text-[10px] font-bold px-2 py-1 rounded-full ${isAuction ? 'bg-hype text-white' : 'bg-mint text-ink'}">${isAuction ? 'AUCTION' : 'BUY NOW'}</span>
                    </div>
                    <p class="text-sm text-muted mb-4">${isAuction ? 'Start $' + p.start_price + ' · ' + p.bid_duration_seconds + 's bid duration' : 'Fixed price $' + p.static_price}</p>
                    <div class="flex gap-2">
                        <button class="act-edit flex-1 py-2 rounded-xl border border-line text-xs font-semibold hover:border-white/30 transition">Edit</button>
                        <button class="act-del flex-1 py-2 rounded-xl bg-hype/10 text-hype text-xs font-semibold hover:bg-hype/20 transition">Delete</button>
                    </div>
                </div>`);
            $card.find('.act-edit').on('click', () => AdminProducts.openModal(p));
            $card.find('.act-del').on('click', async () => {
                if (!confirm(`Delete "${p.name}"?`)) return;
                try {
                    await ProductAPI.remove(p.id);
                    Toast.show('Product deleted', 'success');
                    AdminProducts.load();
                } catch (xhr) {
                    Toast.show(API.errorText(xhr), 'error');
                }
            });
            $wrap.append($card);
        });
        if (!AdminProducts.products.length) {
            $wrap.append('<p class="text-sm text-muted">No products yet. Create your first one.</p>');
        }
    },

    openModal(product) {
        AdminProducts.editingId = product ? product.id : null;
        $('#productModalTitle').text(product ? 'Edit product' : 'Add product');
        $('#pIcon').val(product ? (product.icon || '') : '');
        $('#pName').val(product ? product.name : '');
        $('#pCategory').val(product ? (product.category || '') : '');
        $('#pType').val(product ? product.sale_type : 'auction');
        $('#pPrice').val(product ? (product.sale_type === 'auction' ? product.start_price : product.static_price) : '');
        $('#pBidDuration').val(product && product.bid_duration_seconds ? product.bid_duration_seconds : 30);
        $('#pImage').val('');
        $('#pError').addClass('hidden');
        AdminProducts.toggleFields();
        Modal.open('productModal');
    },

    toggleFields() {
        const auction = $('#pType').val() === 'auction';
        $('#pPriceLabel').text(auction ? 'Start Price ($)' : 'Price ($)');
        $('#pAuctionFields').toggleClass('hidden', !auction);
    },

    async save() {
        const saleType = $('#pType').val();
        const data = {
            name: $('#pName').val().trim(),
            category: $('#pCategory').val().trim(),
            icon: $('#pIcon').val().trim() || null,
            sale_type: saleType
        };
        if (saleType === 'auction') {
            data.start_price = Number($('#pPrice').val());
            data.bid_duration_seconds = Number($('#pBidDuration').val());
        } else {
            data.static_price = Number($('#pPrice').val());
        }

        try {
            if (AdminProducts.editingId) {
                await ProductAPI.update(AdminProducts.editingId, data);
            } else {
                await ProductAPI.create(data);
            }
            Modal.close('productModal');
            Toast.show('Product saved', 'success');
            AdminProducts.load();
        } catch (xhr) {
            $('#pError').text(API.errorText(xhr)).removeClass('hidden');
        }
    },

    init() {
        $('#btnNewProduct').on('click', () => AdminProducts.openModal(null));
        $('#pCancel').on('click', () => Modal.close('productModal'));
        $('#pSave').on('click', AdminProducts.save);
        $('#pType').on('change', AdminProducts.toggleFields);
    }
};
