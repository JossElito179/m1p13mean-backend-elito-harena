const DashboardService = require('../services/dashboard.service');

class DashboardController {
  
  async getCustomerDashboard(req, res) {
    try {
      const userId = req.user.id; 
      
      const stats = await DashboardService.getCustomerStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du tableau de bord client',
        error: error.message
      });
    }
  }

  async getMerchantDashboard(req, res) {
    try {
      const merchantId = req.user.id;
      
      const [stats, recentOrders, quickActions] = await Promise.all([
        DashboardService.getMerchantStats(merchantId),
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          ...stats,
          recentOrders,
          quickActions
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du tableau de bord marchand',
        error: error.message
      });
    }
  }

  async refreshStats(req, res) {
    try {
      const merchantId = req.user.id;
      const { statType } = req.params; 
      
      let data;
      switch(statType) {
        case 'orders':
        case 'revenue':
        case 'products':
        case 'stock':
          const fullStats = await DashboardService.getMerchantStats(merchantId);
          data = fullStats[statType];
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Type de stat invalide'
          });
      }
      
      res.status(200).json({
        success: true,
        data: { [statType]: data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rafraîchissement des stats',
        error: error.message
      });
    }
  }
}

module.exports = new DashboardController();