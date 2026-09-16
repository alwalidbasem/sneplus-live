const ProductAPI = {
    list() { return API.get('/api/products'); },
    get(id) { return API.get('/api/products/' + id); },
    create(data) { return API.post('/api/products', data); },
    update(id, data) { return API.put('/api/products/' + id, data); },
    remove(id) { return API.del('/api/products/' + id); }
};
