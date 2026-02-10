const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth');
const { parseProductFormData } = require('../middleware/productUpload');

router.use(authMiddleware);

router.post(
    '/',
    parseProductFormData, 
    productController.createProduct
);

router.get('/', productController.getProductsPaginated);
router.get('/stats', productController.getStats);
router.get('/:id', productController.getProductById);
router.put(
    '/:id',
    parseProductFormData, 
    productController.updateProduct
);
router.delete('/:id', productController.deleteProduct);

router.post(
    '/:id/images',
    (req, res, next) => {
        upload.array('images', 10)(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    },
    productController.addImages
);

module.exports = router;