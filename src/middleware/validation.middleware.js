const { isNonEmptyString, isPositiveInt, isPrice } = require('../utils/validators');

// Small body-field validation helpers. Each returns an Error with a code when invalid.

function requireFields(body, fields) {
    for (const field of fields) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
            return validationError(`Field '${field}' is required.`);
        }
    }
    return null;
}

function validationError(message, code = 'VALIDATION_ERROR') {
    const error = new Error(message);
    error.code = code;
    error.status = 400;
    return error;
}

function validateProductInput(body) {
    const saleType = body.sale_type;
    if (!['auction', 'buy_now'].includes(saleType)) {
        return validationError("sale_type must be 'auction' or 'buy_now'.");
    }
    if (!isNonEmptyString(body.name, 1, 200)) {
        return validationError('Product name is required (max 200 characters).');
    }
    if (body.image_url && !isValidImageUrl(body.image_url)) {
        return validationError('image_url must be an internal /uploads/products/ path or an http(s) URL.');
    }
    if (saleType === 'auction') {
        if (!isPrice(body.start_price)) return validationError('A valid start price (>= 1) is required.');
        if (!isPositiveInt(body.bid_duration_seconds) || body.bid_duration_seconds < 5) {
            return validationError('Bid duration must be at least 5 seconds.');
        }
    } else if (!isPrice(body.static_price)) {
        return validationError('A valid static price (>= 1) is required.');
    }
    return null;
}

// Only allow internal upload paths or http(s) URLs in image fields.
function isValidImageUrl(url) {
    if (typeof url !== 'string') return false;
    return /^\/uploads\/products\/[A-Za-z0-9._-]+$/.test(url) || /^https?:\/\/\S+$/i.test(url);
}

function validateWaitlistInput(body) {
    if (!isNonEmptyString(body.name, 2, 120)) return validationError('Please enter your name.');
    if (!isNonEmptyString(body.country, 1, 80)) return validationError('Please select your country.');
    if (!['buyer', 'seller', 'creator'].includes(body.user_type)) return validationError('Please select a user type.');
    if (!isNonEmptyString(body.category, 1, 80)) return validationError('Please select a category.');
    return null;
}

function validateBidAmount(amount) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return validationError('Enter a valid bid amount.');
    }
    return null;
}

module.exports = {
    requireFields,
    validationError,
    validateProductInput,
    validateWaitlistInput,
    validateBidAmount,
    isPositiveInt,
    isPrice
};
