// jQuery AJAX wrapper used by every API module.
const API = {
    get(url) {
        return $.ajax({ url, method: 'GET', dataType: 'json' });
    },

    post(url, data) {
        return $.ajax({
            url,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data || {})
        });
    },

    put(url, data) {
        return $.ajax({
            url,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data || {})
        });
    },

    del(url) {
        return $.ajax({ url, method: 'DELETE', dataType: 'json' });
    },

    // Uniform error extraction for .fail() handlers.
    errorText(xhr) {
        const err = xhr.responseJSON && xhr.responseJSON.error;
        return err ? err.message : 'Something went wrong. Please try again.';
    },

    errorCode(xhr) {
        const err = xhr.responseJSON && xhr.responseJSON.error;
        return err ? err.code : 'UNKNOWN';
    }
};
