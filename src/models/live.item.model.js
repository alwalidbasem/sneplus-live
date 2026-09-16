const db = require('../config/database');

const ITEM_SELECT = `
    SELECT i.*, p.name, p.category, p.image_url, p.icon, p.description, p.sale_type
    FROM live_session_items i
    JOIN products p ON p.id = i.product_id`;

async function findItemsBySession(sessionId) {
    const result = await db.query(
        `${ITEM_SELECT} WHERE i.live_session_id = $1 ORDER BY i.position, i.id`,
        [sessionId]
    );
    return result.rows;
}

async function findItemById(itemId) {
    const result = await db.query(`${ITEM_SELECT} WHERE i.id = $1`, [itemId]);
    return result.rows[0];
}

async function findActiveItem(sessionId) {
    const result = await db.query(
        `${ITEM_SELECT} WHERE i.live_session_id = $1 AND i.status = 'active' LIMIT 1`,
        [sessionId]
    );
    return result.rows[0];
}

async function findUnsoldItems(sessionId) {
    const result = await db.query(
        `${ITEM_SELECT} WHERE i.live_session_id = $1 AND i.status = 'unsold' ORDER BY i.position, i.id`,
        [sessionId]
    );
    return result.rows;
}

async function addItems(sessionId, productIds) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const posResult = await client.query(
            'SELECT COALESCE(MAX(position), 0)::int AS max FROM live_session_items WHERE live_session_id = $1',
            [sessionId]
        );
        let position = posResult.rows[0].max;
        const inserted = [];
        for (const productId of productIds) {
            const product = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
            if (!product.rows[0]) continue;
            const p = product.rows[0];
            position++;
            const item = await client.query(
                `INSERT INTO live_session_items
                    (live_session_id, product_id, position, start_price, static_price, bid_duration_seconds)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [sessionId, productId, position, p.start_price, p.static_price, p.bid_duration_seconds]
            );
            inserted.push(item.rows[0].id);
        }
        await client.query('COMMIT');
        return inserted;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function removeItem(itemId) {
    const result = await db.query(
        `DELETE FROM live_session_items WHERE id = $1 AND status = 'pending' RETURNING id`,
        [itemId]
    );
    return result.rows[0];
}

async function reorderItems(sessionId, orderedIds) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < orderedIds.length; i++) {
            await client.query(
                `UPDATE live_session_items SET position = $1
                 WHERE id = $2 AND live_session_id = $3 AND status != 'active'`,
                [i + 1, orderedIds[i], sessionId]
            );
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    findItemsBySession, findItemById, findActiveItem, findUnsoldItems,
    addItems, removeItem, reorderItems
};

