const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const env = require('../config/env');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/helpers');

// ---- image upload (product images only) ----
const uploadDir = path.join(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
        }
    }),
    limits: { fileSize: env.upload.maxBytes },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
            return cb(null, true);
        }
        cb(new Error('Only JPG, PNG or WebP images are allowed.'));
    }
});

// Local upload URL; a cloud storage adapter can replace this later.
function uploadedImageUrl(req) {
    return req.file ? `/uploads/products/${req.file.filename}` : null;
}

router.get('/', asyncHandler(productsController.listProducts));
router.get('/:id', asyncHandler(productsController.getProduct));
router.post('/', requireAdmin, upload.single('image'), (req, res, next) => {
    if (req.file) req.body.image_url = uploadedImageUrl(req);
    next();
}, asyncHandler(productsController.createProduct));
router.put('/:id', requireAdmin, upload.single('image'), (req, res, next) => {
    if (req.file) req.body.image_url = uploadedImageUrl(req);
    next();
}, asyncHandler(productsController.updateProduct));
router.delete('/:id', requireAdmin, asyncHandler(productsController.deleteProduct));

module.exports = router;
