const LiveAPI = {
    list() { return API.get('/api/live'); },
    get(id) { return API.get('/api/live/' + id); },
    create(title) { return API.post('/api/live', { title }); },
    getItems(id) { return API.get('/api/live/' + id + '/items'); },
    addItems(id, productIds) { return API.post('/api/live/' + id + '/items', { product_ids: productIds }); },
    reorderItems(id, itemIds) { return API.put('/api/live/' + id + '/items/reorder', { item_ids: itemIds }); },
    removeItem(id, itemId) { return API.del('/api/live/' + id + '/items/' + itemId); },
    itemBids(liveId, itemId) { return API.get('/api/live/' + liveId + '/items/' + itemId + '/bids'); }
};
