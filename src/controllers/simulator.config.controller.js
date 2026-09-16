const simulatorConfig = require('../models/simulator.config.model');
const { success } = require('../utils/response');

function text(value, max = 500) {
    return String(value || '').trim().slice(0, max);
}

function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeViewerEvents(events) {
    return (Array.isArray(events) ? events : [])
        .map((event) => {
            const rawAction = text(event.action || event.event || event.type, 20).toLowerCase();
            return {
                after: Math.max(0, number(event.after, 0)),
                action: ['left', 'leave', 'leaved'].includes(rawAction) ? 'left' : 'joined',
                name: text(event.name, 120),
                pfp_url: text(event.pfp_url || event.pfpUrl, 1000)
            };
        })
        .filter((event) => event.name)
        .sort((a, b) => a.after - b.after);
}

function normalizeComments(comments) {
    return (Array.isArray(comments) ? comments : [])
        .map((comment) => ({
            after: Math.max(0, number(comment.after, 0)),
            name: text(comment.name || comment.user, 120),
            comment: text(comment.comment || comment.text, 300)
        }))
        .filter((comment) => comment.name && comment.comment)
        .sort((a, b) => a.after - b.after);
}

function normalizeBids(bids) {
    return (Array.isArray(bids) ? bids : [])
        .map((bid) => {
            const name = text(bid.name || bid.bidder_username, 120);
            return {
                after: Math.max(0, number(bid.after, 0)),
                name,
                bidder_username: name,
                bid_amount: number(bid.bid_amount, 0)
            };
        })
        .filter((bid) => bid.bid_amount > 0)
        .sort((a, b) => a.after - b.after);
}

function normalizeProduct(product = {}) {
    product = product && typeof product === 'object' ? product : {};
    const type = product.type === 'buynow' ? 'buynow' : 'auction';
    const bids = normalizeBids(product.bids);
    const start = Math.max(1, number(product.start, 1));
    const bidDuration = Math.max(5, number(product.bidDuration, 30), ...bids.map((bid) => bid.after + 4));
    return {
        name: text(product.name, 200) || 'Untitled product',
        icon: text(product.icon, 4) || 'IT',
        imageUrl: text(product.imageUrl || product.image_url, 1000),
        category: text(product.category, 80) || 'Other',
        type,
        start,
        startAfter: Math.max(0, number(product.startAfter, 0)),
        bidDuration,
        joins: normalizeViewerEvents(product.joins),
        comments: normalizeComments(product.comments),
        bids: type === 'auction' ? bids : [],
        status: 'pending'
    };
}

async function getConfig(req, res) {
    const config = await simulatorConfig.readConfig();
    success(res, { config });
}

async function updateConfig(req, res) {
    const config = await simulatorConfig.writeConfig({
        liveVideoUrl: text(req.body.liveVideoUrl, 1000),
        products: (Array.isArray(req.body.products) ? req.body.products : []).map(normalizeProduct)
    });
    success(res, { config });
}

module.exports = { getConfig, updateConfig };
