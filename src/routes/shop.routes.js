const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const authMiddleware = require('../middleware/auth');
const multer = require("multer");

const storage = multer.memoryStorage(); 
const upload = multer({ storage });


router.use(authMiddleware);

router.post('/', upload.single("image") ,shopController.createShop); 
router.get('/', shopController.getShopsPaginated);
router.get('/all', shopController.getAllShops); 
router.get('/search', shopController.searchShops); 
router.get('/stats', shopController.getStats); 
router.get('/:id', shopController.getShopById); 
router.put('/:id',upload.single("image") ,shopController.updateShop); 
router.delete('/:id', shopController.deleteShop); 

module.exports = router;