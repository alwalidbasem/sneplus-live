const authService = require('../services/auth.service');
const { success } = require('../utils/response');
const { isNonEmptyString, isValidEmail } = require('../utils/validators');

async function register(req, res, next) {
    const { name, email, password } = req.body;
    if (!isNonEmptyString(name, 2, 120) || !isValidEmail(email) || !isNonEmptyString(password, 8, 100)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Name, valid email and password (min 8 chars) are required.' }
        });
    }
    const user = await authService.register({ name: name.trim(), email: email.trim().toLowerCase(), password });
    req.session.user = user;
    success(res, { user }, 201);
}

async function login(req, res, next) {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !isNonEmptyString(password, 1, 100)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' }
        });
    }
    const user = await authService.login(email.trim().toLowerCase(), password);
    req.session.user = user;
    success(res, { user });
}

async function logout(req, res, next) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        success(res, { loggedOut: true });
    });
}

async function me(req, res, next) {
    success(res, { user: req.session ? req.session.user : null });
}

module.exports = { register, login, logout, me };
