const waitlistModel = require('../models/waitlist.model');
const { success } = require('../utils/response');
const { isValidEmail, sanitizeText } = require('../utils/validators');
const { validateWaitlistInput } = require('../middleware/validation.middleware');

const MESSAGES = {
    en: {
        invalidEmail: 'Please enter a valid email address.',
        duplicate: 'This email is already registered.',
        success: "You're on the list. We'll notify you when Sneplus Live launches."
    },
    ar: {
        invalidEmail: 'الرجاء إدخال بريد إلكتروني صحيح.',
        duplicate: 'هذا البريد الإلكتروني مسجل مسبقا.',
        success: 'تم تسجيلك بنجاح. سنخبرك عند إطلاق Sneplus Live.'
    }
};

function waitlistLanguage(body) {
    return body.language === 'ar' ? 'ar' : 'en';
}

function localizedError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message }
    });
}

async function joinWaitlist(req, res, next) {
    const language = waitlistLanguage(req.body);
    const messages = MESSAGES[language];
    const error = validateWaitlistInput(req.body);
    if (error) return next(error);

    const email = req.body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
        return localizedError(res, 400, 'VALIDATION_ERROR', messages.invalidEmail);
    }

    if (await waitlistModel.existsByEmail(email)) {
        return localizedError(res, 409, 'EMAIL_EXISTS', messages.duplicate);
    }

    try {
        const entry = await waitlistModel.create({
            name: sanitizeText(req.body.name),
            email,
            country: sanitizeText(req.body.country),
            userType: req.body.user_type,
            category: sanitizeText(req.body.category),
            language
        });
        success(res, { entry, message: messages.success }, 201);
    } catch (err) {
        if (err.code === '23505') {
            return localizedError(res, 409, 'EMAIL_EXISTS', messages.duplicate);
        }
        throw err;
    }
}

async function listWaitlist(req, res, next) {
    const rows = await waitlistModel.list(200);
    success(res, { entries: rows });
}

module.exports = { joinWaitlist, listWaitlist };
