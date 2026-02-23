const Order = require('../models/order.model');
const Shop = require('../models/shop.model');

class OrderService {

    static ALLOWED_TRANSITIONS = {
        'CONFIRMED': ['PREPARING'],
        'PREPARING': ['READY'],
        'READY': ['DELIVERED'],
        'DELIVERED': []
    };

    async updateOrderStatus(orderId, newStatus, userId, userRole, shopId = null) {
        const query = { _id: orderId };
        if (userRole !== 'ADMIN') {
            query.deletedAt = null;
        }

        const order = await Order.findOne(query);
        if (!order) {
            throw new Error('Commande non trouvée');
        }

        if (userRole === 'SHOP') {
            if (!shopId) {
                throw new Error('Identifiant de boutique requis');
            }

            if (order.shopId.toString() !== shopId) {
                throw new Error('Non autorisé - Cette commande ne vous appartient pas');
            }

            const shop = await Shop.findOne({ _id: shopId, deletedAt: null });
            if (!shop) {
                throw new Error('Boutique non trouvée ou inactive');
            }
        }

        const currentStatus = order.status;
        const allowedTransitions = OrderService.ALLOWED_TRANSITIONS[currentStatus];

        if (!allowedTransitions.includes(newStatus)) {
            throw new Error(
                `Transition non autorisée de ${currentStatus} vers ${newStatus}`
            );
        }

        order.status = newStatus;
        await order.save();

        return this.formatOrderResponse(order);
    }


    async getUserOrders(userId, queryParams) {
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'createdAt',
            order = 'desc'
        } = queryParams;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = {
            userId,
            deletedAt: null
        };

        if (status) {
            filter.status = status;
        }

        const sort = {};
        sort[sortBy] = order === 'desc' ? -1 : 1;

        const [data, totalItems] = await Promise.all([
            Order.find(filter)
                .populate('shopId', 'name logo')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Order.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        return {
            data: data.map(order => this.formatOrderResponse(order)),
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages
            }
        };
    }

    async getShopOrders(shopId, queryParams) {
        const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            sortBy = 'createdAt',
            order = 'desc'
        } = queryParams;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = {
            shopId,
            deletedAt: null
        };

        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        const sort = {};
        sort[sortBy] = order === 'desc' ? -1 : 1;

        const [data, totalItems] = await Promise.all([
            Order.find(filter)
                .populate('userId', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Order.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalItems / limitNum);

        return {
            data: data.map(order => this.formatOrderResponse(order, true)),
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalItems,
                totalPages
            }
        };
    }

    async getOrderById(orderId, userId, userRole, shopId = null) {
        const query = { _id: orderId, deletedAt: null };

        const order = await Order.findOne(query)
            .populate('userId', 'name email')
            .populate('shopId', 'name logo address');

        if (!order) {
            throw new Error('Commande non trouvée');
        }

        if (userRole === 'USER' && order.userId._id.toString() !== userId) {
            throw new Error('Non autorisé');
        }

        if (userRole === 'SHOP') {
            if (!shopId || order.shopId._id.toString() !== shopId) {
                throw new Error('Non autorisé');
            }
        }

        return this.formatOrderResponse(order, userRole === 'SHOP');
    }

    async softDeleteOrder(orderId, userId) {
        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                deletedAt: new Date()
            },
            { new: true }
        );

        if (!order) {
            throw new Error('Commande non trouvée');
        }

        return this.formatOrderResponse(order);
    }

    async restoreOrder(orderId) {
        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                deletedAt: null
            },
            { new: true }
        );

        if (!order) {
            throw new Error('Commande non trouvée');
        }

        return this.formatOrderResponse(order);
    }

    formatOrderResponse(order, includeUserInfo = false) {
        const formatted = {
            id: order._id,
            shop: order.shopId ? {
                id: order.shopId._id || order.shopId,
                name: order.shopId.name,
                logo: order.shopId.logo
            } : { id: order.shopId },
            items: order.items.map(item => ({
                productId: item.productId,
                name: item.nameSnapshot,
                price: item.priceSnapshot,
                quantity: item.quantity,
                subtotal: item.priceSnapshot * item.quantity
            })),
            totalAmount: order.totalAmount,
            currency: order.currency,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        if (includeUserInfo && order.userId) {
            formatted.user = {
                id: order.userId._id || order.userId,
                name: order.userId.name,
                email: order.userId.email
            };
        }

        return formatted;
    }
}

module.exports = new OrderService();