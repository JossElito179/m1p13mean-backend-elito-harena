const express = require('express');
const router = express.Router();
const cartController = require('../controllers/carts.controller');
const authMiddleware  = require('../middleware/auth');
const authorize = require('../middleware/roles')

router.use(authMiddleware);

router.get('/', authorize('USER') ,cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:productId', cartController.updateQuantity);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

router.post('/orders/confirm', cartController.confirmOrder);

module.exports = router;