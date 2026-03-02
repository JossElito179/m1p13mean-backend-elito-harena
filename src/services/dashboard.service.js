const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');

class DashboardService {
  
  async getCustomerStats(userId) {
    try {
      const activeOrders = await Order.countDocuments({
        userId,
        status: { $in: ['CONFIRMED', 'PREPARING'] }
      });

      const favoriteShops = await Order.distinct('shopId', {
        userId
      }).then(shops => shops.length);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const orders = await Order.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      }).populate('items.productId');
      
      const viewedProducts = [...new Set(
        orders.flatMap(order => 
          order.items.map(item => item.productId?.toString())
        ).filter(Boolean)
      )].length;

      return {
        activeOrders,
        favoriteShops,
        viewedProducts
      };
    } catch (error) {
      throw error;
    }
  }

  async getMerchantStats(merchantId) {
    try {
      const shops = await Shop.find({ownerId : merchantId }).select('_id');
      const shopIds = shops.map(shop => shop._id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayOrders = await Order.countDocuments({
        shopId: { $in: shopIds },
        createdAt: { $gte: today }
      });

      const yesterdayOrders = await Order.countDocuments({
        shopId: { $in: shopIds },
        createdAt: { $gte: yesterday, $lt: today }
      });

      const todayRevenue = await Order.aggregate([
        { $match: { 
          shopId: { $in: shopIds },
          createdAt: { $gte: today }
        }},
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      const yesterdayRevenue = await Order.aggregate([
        { $match: { 
          shopId: { $in: shopIds },
          createdAt: { $gte: yesterday, $lt: today }
        }},
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      const products = await Product.find({ shopId: { $in: shopIds } });
      const totalProducts = products.length;
      
      const newProductsToday = products.filter(p => 
        p.createdAt >= today
      ).length;

      const lowStock = products.filter(p => p.stock < 5).length;
      
      const yesterdayLowStock = products.filter(p => 
        p.stock < 5 && p.updatedAt < today && p.updatedAt >= yesterday
      ).length;
      const lowStockChange = lowStock - yesterdayLowStock;

      const revenueChange = yesterdayRevenue[0]?.total 
        ? `${Math.round(((todayRevenue[0]?.total || 0) - yesterdayRevenue[0].total) / yesterdayRevenue[0].total * 100)}%`
        : '+0%';

      return {
        dailyOrders: {
          count: todayOrders,
          change: todayOrders - yesterdayOrders
        },
        revenue: {
          total: todayRevenue[0]?.total || 0,
          change: revenueChange
        },
        products: {
          total: totalProducts,
          change: newProductsToday
        },
        lowStock: {
          count: lowStock,
          change: lowStockChange
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DashboardService();