const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth');
const authorize =  require('../middleware/roles')

router.use(authMiddleware);

router.get(
  '/customer', 
  DashboardController.getCustomerDashboard.bind(DashboardController)
);

router.get(
  '/merchant',
  DashboardController.getMerchantDashboard.bind(DashboardController)
);

router.get(
  '/admin',
  authorize('ADMIN'),
  DashboardController.getAdminDashboard.bind(DashboardController)
);

module.exports = router;