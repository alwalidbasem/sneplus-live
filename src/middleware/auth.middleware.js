function requireAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'You must be logged in.' }
    });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && ['admin', 'host'].includes(req.session.user.role)) {
        return next();
    }
    res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin or host access required.' }
    });
}

module.exports = { requireAuth, requireAdmin };
