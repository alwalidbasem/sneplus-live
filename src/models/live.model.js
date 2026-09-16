const db = require('../config/database');

// ---------- live sessions ----------

async function findSessions({ includeEnded = false } = {}) {
    const where = includeEnded ? '' : "WHERE status != 'ended'";
    const result = await db.query(
        `SELECT s.*, u.name AS host_name
         FROM live_sessions s LEFT JOIN users u ON u.id = s.host_id
         ${where}
         ORDER BY s.created_at DESC`
    );
    return result.rows;
}

async function findSessionById(id) {
    const result = await db.query(
        `SELECT s.*, u.name AS host_name
         FROM live_sessions s LEFT JOIN users u ON u.id = s.host_id
         WHERE s.id = $1`,
        [id]
    );
    return result.rows[0];
}

async function findActiveSession() {
    const result = await db.query(
        `SELECT * FROM live_sessions WHERE status IN ('live','paused') ORDER BY created_at DESC LIMIT 1`
    );
    return result.rows[0];
}

async function createSession({ title, hostId }) {
    const result = await db.query(
        `INSERT INTO live_sessions (title, host_id) VALUES ($1, $2) RETURNING *`,
        [title, hostId]
    );
    return result.rows[0];
}

async function updateSession(id, fields) {
    const allowed = ['title', 'status', 'current_item_id', 'viewer_peak', 'started_at', 'ended_at'];
    const sets = [];
    const values = [];
    let param = 1;
    for (const key of allowed) {
        if (fields[key] !== undefined) {
            sets.push(`${key} = $${param}`);
            values.push(fields[key]);
            param++;
        }
    }
    if (!sets.length) return findSessionById(id);
    sets.push(`updated_at = NOW()`);
    values.push(id);
    const result = await db.query(
        `UPDATE live_sessions SET ${sets.join(', ')} WHERE id = $${param} RETURNING *`,
        values
    );
    return result.rows[0];
}

async function raiseViewerPeak(sessionId, count) {
    const result = await db.query(
        `UPDATE live_sessions SET viewer_peak = GREATEST(viewer_peak, $2), updated_at = NOW()
         WHERE id = $1 RETURNING viewer_peak`,
        [sessionId, count]
    );
    return result.rows[0];
}

// Re-export live-session-item helpers (kept in live.item.model.js to stay small).
const items = require('./live.item.model');

module.exports = {
    findSessions, findSessionById, findActiveSession,
    createSession, updateSession, raiseViewerPeak,
    findItemsBySession: items.findItemsBySession,
    findItemById: items.findItemById,
    findActiveItem: items.findActiveItem,
    findUnsoldItems: items.findUnsoldItems,
    addItems: items.addItems,
    removeItem: items.removeItem,
    reorderItems: items.reorderItems
};

