const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/shops', userController.getShopUsers);

module.exports = router;