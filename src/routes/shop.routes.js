const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth');
const multer = require("multer");
const authorize = require('../middleware/roles');

const storage = multer.memoryStorage(); 
const upload = multer({ storage });


router.use(authMiddleware);

router.post('/', upload.single("image") ,shopController.createShop); 
router.get('/', shopController.getShopsPaginated);
router.get('/all', shopController.getAllShops); 
router.get('/search', shopController.searchShops); 
router.get('/stats', shopController.getStats); 
router.get('/byId/:id', shopController.getShopById); 
router.put('/:id',upload.single("image") ,shopController.updateShop); 
router.delete('/:id', shopController.deleteShop); 
router.get('/orders', 
    authorize('SHOP'), 
    orderController.getShopOrders
);

router.patch('/orders/:id/status',
    authorize('SHOP'),
    orderController.updateStatus
);

module.exports = router;