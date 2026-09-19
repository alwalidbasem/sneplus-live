const orderModel = require('../models/order.model');
const { success } = require('../utils/response');

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

async function listOrders(req, res, next) {
    const isAdmin = ['admin', 'host'].includes(req.session.user.role);
    const orders = isAdmin ? await orderModel.listAll(200) : await orderModel.listForUser(req.session.user.id);
    success(res, { orders });
}

async function getOrder(req, res, next) {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Order not found.' }
        });
    }
    const order = await orderModel.findById(id);
    if (!order) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Order not found.' }
        });
    }
    const isAdmin = ['admin', 'host'].includes(req.session.user.role);
    if (!isAdmin && order.user_id !== req.session.user.id) {
        return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'This order belongs to another user.' }
        });
    }
    success(res, { order });
}

module.exports = { listOrders, getOrder };
