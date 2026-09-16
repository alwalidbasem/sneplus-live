const db = require('../config/database');
const waitlistModel = require('../models/waitlist.model');
const { success } = require('../utils/response');
const logger = require('../utils/logger');

// PostgreSQL aggregation queries — the browser only renders results.
async function dashboard(req, res, next) {
    const stats = await db.query(`
        SELECT
            (SELECT COUNT(*)::int FROM products WHERE is_active)                AS total_products,
            (SELECT COUNT(*)::int FROM live_session_items WHERE status='sold')  AS products_sold,
            (SELECT COUNT(*)::int FROM live_session_items WHERE status='unsold') AS products_unsold,
            (SELECT COUNT(*)::int FROM bids)                                    AS total_bids,
            (SELECT COALESCE(SUM(final_price),0) FROM live_session_items i
                JOIN products p ON p.id=i.product_id
                WHERE i.status='sold' AND p.sale_type='auction')                AS auction_revenue,
            (SELECT COALESCE(SUM(final_price),0) FROM live_session_items i
                JOIN products p ON p.id=i.product_id
                WHERE i.status='sold' AND p.sale_type='buy_now')                AS buynow_revenue
    `);
    const revenue = stats.rows[0];
    revenue.auction_revenue = Number(revenue.auction_revenue);
    revenue.buynow_revenue = Number(revenue.buynow_revenue);
    revenue.total_revenue = revenue.auction_revenue + revenue.buynow_revenue;

    const activeLive = await db.query(
        `SELECT s.*, (SELECT COUNT(*)::int FROM live_session_items WHERE live_session_id=s.id) AS items
         FROM live_sessions s WHERE s.status IN ('live','paused') ORDER BY s.created_at DESC LIMIT 1`
    );

    const orders = await db.query(
        `SELECT o.id, o.total, o.status, o.created_at, u.name AS buyer_name
         FROM orders o JOIN users u ON u.id=o.user_id
         ORDER BY o.created_at DESC LIMIT 10`
    );

    const waitlist = await waitlistModel.list(200);
    const waitlistStats = await waitlistModel.countByType();
    const waitlistCountries = await waitlistModel.countByColumn('country');
    const waitlistCategories = await waitlistModel.countByColumn('category');
    const waitlistDays = await waitlistModel.countLast7Days();

    success(res, {
        stats: revenue,
        activeLive: activeLive.rows[0] || null,
        latestOrders: orders.rows,
        latestWaitlist: waitlist.slice(0, 20),
        waitlistStats,
        waitlistCountries,
        waitlistCategories,
        waitlistDays
    });
}

async function stats(req, res, next) {
    try {
        const rows = await db.query(`
            SELECT
                (SELECT COUNT(*)::int FROM live_sessions)                    AS total_lives,
                (SELECT COUNT(*)::int FROM live_sessions WHERE status='ended') AS ended_lives,
                (SELECT COALESCE(MAX(viewer_peak),0) FROM live_sessions)     AS peak_viewers,
                (SELECT COUNT(*)::int FROM users)                            AS total_users,
                (SELECT COUNT(*)::int FROM waitlist_entries)                 AS total_waitlist
        `);
        success(res, { stats: rows.rows[0] });
    } catch (err) {
        logger.error('Admin stats query failed:', err.message);
        next(err);
    }
}

module.exports = { dashboard, stats };
