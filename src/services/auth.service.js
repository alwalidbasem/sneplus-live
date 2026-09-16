const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { PublicUser } = require('../models/user.model');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

async function register({ name, email, password, role = 'buyer' }) {
    const existing = await userModel.findByEmail(email);
    if (existing) {
        const error = new Error('An account with this email already exists.');
        error.code = 'EMAIL_EXISTS';
        error.status = 409;
        throw error;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.create({ name, email, passwordHash, role });
    return PublicUser(user);
}

async function login(email, password) {
    const user = await userModel.findByEmail(email);
    if (!user || !user.is_active) {
        logger.warn('Login failed (unknown user):', email);
        const error = new Error('Invalid email or password.');
        error.code = 'INVALID_CREDENTIALS';
        error.status = 401;
        throw error;
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        logger.warn('Login failed (bad password):', email);
        const error = new Error('Invalid email or password.');
        error.code = 'INVALID_CREDENTIALS';
        error.status = 401;
        throw error;
    }
    return PublicUser(user);
}

module.exports = { register, login };
