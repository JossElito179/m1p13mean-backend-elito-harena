const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');
const User = require('../models/user.model')

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
      const shops = await Shop.find({ ownerId: merchantId }).select('_id');
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
        {
          $match: {
            shopId: { $in: shopIds },
            createdAt: { $gte: today }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      const yesterdayRevenue = await Order.aggregate([
        {
          $match: {
            shopId: { $in: shopIds },
            createdAt: { $gte: yesterday, $lt: today }
          }
        },
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

  async getAdminStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

      const totalShops = await Shop.countDocuments();

      const totalCustomers = await User.countDocuments({ role: 'USER' });

      const monthlyRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: firstDayOfMonth },
            status: 'DELIVERED'
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      const monthlyOrders = await Order.countDocuments({
        createdAt: { $gte: firstDayOfMonth }
      });

      const shops = await Shop.find().select('_id');
      const shopIds = shops.map(s => s._id);

      const conversionRates = await Order.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        {
          $group: {
            _id: '$shopId',
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            conversionRate: {
              $multiply: [
                { $divide: ['$completedOrders', '$totalOrders'] },
                100
              ]
            }
          }
        }
      ]);

      const avgConversion = conversionRates.length > 0
        ? conversionRates.reduce((acc, curr) => acc + curr.conversionRate, 0) / conversionRates.length
        : 0;

      const outOfStock = await Product.countDocuments({ stock: 0 });

      const totalShopSpaces = 50;
      const occupiedSpaces = totalShops;
      const occupancyRate = (occupiedSpaces / totalShopSpaces) * 100;

      const newMerchants = await User.countDocuments({
        role: 'SHOP',
        createdAt: { $gte: firstDayOfMonth }
      });

      return {
        totalShops: {
          value: totalShops,
          label: 'Boutiques totales',
          icon: 'store',
          color: 'blue'
        },
        totalCustomers: {
          value: totalCustomers,
          label: 'Clients inscrits',
          icon: 'people',
          color: 'green'
        },
        monthlyRevenue: {
          value: monthlyRevenue[0]?.total || 0,
          label: 'CA mensuel',
          icon: 'euro',
          color: 'purple',
          format: 'currency'
        },
        monthlyOrders: {
          value: monthlyOrders,
          label: 'Commandes (mois)',
          icon: 'shopping-cart',
          color: 'orange'
        },
        avgConversion: {
          value: Math.round(avgConversion * 10) / 10,
          label: 'Conversion moyenne',
          icon: 'trending-up',
          color: 'teal',
          unit: '%'
        },
        outOfStock: {
          value: outOfStock,
          label: 'Ruptures de stock',
          icon: 'warning',
          color: 'red'
        },
        occupancyRate: {
          value: Math.round(occupancyRate * 10) / 10,
          label: 'Taux d\'occupation',
          icon: 'building',
          color: 'indigo',
          unit: '%'
        },
        newMerchants: {
          value: newMerchants,
          label: 'Nouveaux marchands',
          icon: 'user-plus',
          color: 'pink'
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DashboardService();