const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get(
  '/customer', 
  DashboardController.getCustomerDashboard.bind(DashboardController)
);

router.get(
  '/merchant',
  DashboardController.getMerchantDashboard.bind(DashboardController)
);


module.exports = router;