const productModel = require('../models/product.model');
const { success } = require('../utils/response');
const { sanitizeText } = require('../utils/validators');
const { validateProductInput } = require('../middleware/validation.middleware');

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parseProductBody(body) {
    return {
        name: sanitizeText(body.name),
        description: body.description ? sanitizeText(body.description) : null,
        category: body.category ? sanitizeText(body.category) : null,
        imageUrl: body.image_url || null,
        icon: body.icon ? sanitizeText(String(body.icon)).slice(0, 4) : null,
        saleType: body.sale_type,
        startPrice: body.start_price !== undefined && body.start_price !== '' ? Number(body.start_price) : null,
        staticPrice: body.static_price !== undefined && body.static_price !== '' ? Number(body.static_price) : null,
        bidDurationSeconds: body.bid_duration_seconds ? Number(body.bid_duration_seconds) : null
    };
}

async function listProducts(req, res, next) {
    const products = await productModel.findAll();
    success(res, { products });
}

async function getProduct(req, res, next) {
    const id = parseId(req.params.id);
    const product = id ? await productModel.findById(id) : null;
    if (!product) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Product not found.' }
        });
    }
    success(res, { product });
}

async function createProduct(req, res, next) {
    const error = validateProductInput(req.body);
    if (error) return next(error);
    const fields = parseProductBody(req.body);
    const product = await productModel.create({ ...fields, createdBy: req.session.user.id });
    success(res, { product }, 201);
}

async function updateProduct(req, res, next) {
    const id = parseId(req.params.id);
    const existing = id ? await productModel.findById(id) : null;
    if (!existing) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Product not found.' }
        });
    }
    const merged = { ...existing, ...req.body };
    const error = validateProductInput(merged);
    if (error) return next(error);

    const fields = {};
    const parsed = parseProductBody(req.body);
    for (const key of ['name', 'description', 'category', 'imageUrl', 'icon', 'saleType', 'startPrice', 'staticPrice', 'bidDurationSeconds']) {
        if (parsed[key] !== null || req.body[key] !== undefined) fields[key] = parsed[key];
    }
    if (req.body.is_active !== undefined) fields.isActive = !!req.body.is_active;
    const snakeFields = {
        name: fields.name,
        description: fields.description,
        category: fields.category,
        image_url: fields.imageUrl !== undefined ? fields.imageUrl : undefined,
        icon: fields.icon,
        sale_type: fields.saleType,
        start_price: fields.startPrice,
        static_price: fields.staticPrice,
        bid_duration_seconds: fields.bidDurationSeconds,
        is_active: fields.isActive
    };
    // Keep type-specific price columns consistent when the sale type changes,
    // otherwise the products CHECK constraint rejects the update with a 500.
    if (snakeFields.sale_type === 'buy_now') {
        snakeFields.start_price = null;
        snakeFields.bid_duration_seconds = null;
    } else if (snakeFields.sale_type === 'auction') {
        snakeFields.static_price = null;
    }
    const product = await productModel.update(existing.id, snakeFields);
    success(res, { product });
}

async function deleteProduct(req, res, next) {
    const id = parseId(req.params.id);
    const deleted = id ? await productModel.remove(id) : null;
    if (!deleted) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Product not found.' }
        });
    }
    success(res, { deletedId: deleted.id });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
