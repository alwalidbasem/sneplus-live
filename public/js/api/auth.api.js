const AuthAPI = {
    me() { return API.get('/api/auth/me'); },
    login(email, password) { return API.post('/api/auth/login', { email, password }); },
    register(name, email, password) { return API.post('/api/auth/register', { name, email, password }); },
    logout() { return API.post('/api/auth/logout', {}); }
};
