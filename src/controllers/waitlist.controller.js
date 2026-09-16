const waitlistModel = require('../models/waitlist.model');
const { success } = require('../utils/response');
const { isValidEmail, sanitizeText } = require('../utils/validators');
const { validateWaitlistInput } = require('../middleware/validation.middleware');

async function joinWaitlist(req, res, next) {
    const error = validateWaitlistInput(req.body);
    if (error) return next(error);

    const email = req.body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' }
        });
    }

    if (await waitlistModel.existsByEmail(email)) {
        return res.status(409).json({
            success: false,
            error: { code: 'EMAIL_EXISTS', message: 'This email is already registered.' }
        });
    }

    const entry = await waitlistModel.create({
        name: sanitizeText(req.body.name),
        email,
        country: sanitizeText(req.body.country),
        userType: req.body.user_type,
        category: sanitizeText(req.body.category),
        language: req.body.language === 'ar' ? 'ar' : 'en'
    });
    success(res, { entry }, 201);
}

async function listWaitlist(req, res, next) {
    const rows = await waitlistModel.list(200);
    success(res, { entries: rows });
}

module.exports = { joinWaitlist, listWaitlist };
