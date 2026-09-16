const success = (res, data, status = 200) => {
    res.status(status).json({ success: true, data });
};

const failure = (res, code, message, status = 400) => {
    res.status(status).json({
        success: false,
        error: { code, message }
    });
};

// Standard socket payloads use the same shape as REST responses.
const socketOk = (data) => ({ success: true, data });
const socketFail = (code, message) => ({ success: false, error: { code, message } });

module.exports = { success, failure, socketOk, socketFail };
