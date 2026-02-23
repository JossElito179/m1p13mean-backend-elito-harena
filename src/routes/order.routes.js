const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

router.use(auth);

router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);

router.patch('/:id/status', 
    authorize('SHOP'), 
    orderController.updateStatus
);

router.delete('/:id', 
    authorize('ADMIN'), 
    orderController.softDeleteOrder
);

router.post('/:id/restore', 
    authorize('ADMIN'), 
    orderController.restoreOrder
);

module.exports = router;