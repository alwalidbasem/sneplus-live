const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value) => typeof value === 'string' && EMAIL_RE.test(value.trim());

const isNonEmptyString = (value, minLength = 1, maxLength = 10000) =>
    typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const isPrice = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1;
};

const WAITLIST_TYPES = ['buyer', 'seller', 'creator'];
const SALE_TYPES = ['auction', 'buy_now'];

const sanitizeText = (value) =>
    String(value ?? '')
        .replace(/[<>]/g, '')  // strip angle brackets; output is also escaped on render
        .trim();

module.exports = {
    isValidEmail,
    isNonEmptyString,
    isPositiveInt,
    isPrice,
    WAITLIST_TYPES,
    SALE_TYPES,
    sanitizeText
};
