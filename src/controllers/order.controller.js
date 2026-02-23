const orderService = require('../services/order.service');

class OrderController {
    
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const { id: userId, role } = req.user;
            
            const validStatuses = ['PREPARING', 'READY', 'DELIVERED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: `Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`
                });
            }

            let shopId = null;
            if (role === 'SHOP') {
                shopId = req.user.shopId;
                if (!shopId) {
                    return res.status(403).json({
                        error: 'Aucune boutique associée à cet utilisateur'
                    });
                }
            }

            const order = await orderService.updateOrderStatus(
                id,
                status,
                userId,
                role,
                shopId
            );

            res.json({
                success: true,
                data: order,
                message: `Statut mis à jour: ${status}`
            });
        } catch (error) {
            if (error.message.includes('non trouvée')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Non autorisé')) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes('Transition non autorisée')) {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    }

    async getUserOrders(req, res, next) {
        try {
            const { id: userId } = req.user;
            const queryParams = req.query;

            const result = await orderService.getUserOrders(userId, queryParams);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    async getShopOrders(req, res, next) {
        try {
            const { role, shopId } = req.user;
            
            if (role !== 'SHOP' || !shopId) {
                return res.status(403).json({
                    error: 'Accès réservé aux boutiques'
                });
            }

            const queryParams = req.query;
            const result = await orderService.getShopOrders(shopId, queryParams);

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const { id: userId, role, shopId } = req.user;

            const order = await orderService.getOrderById(id, userId, role, shopId);

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            if (error.message.includes('non trouvée')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Non autorisé')) {
                return res.status(403).json({ error: error.message });
            }
            next(error);
        }
    }

    async softDeleteOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { id: userId, role } = req.user;

            if (role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Action réservée aux administrateurs'
                });
            }

            const order = await orderService.softDeleteOrder(id, userId);

            res.json({
                success: true,
                data: order,
                message: 'Commande supprimée (soft delete)'
            });
        } catch (error) {
            if (error.message.includes('non trouvée')) {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    }

    async restoreOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.user;

            if (role !== 'ADMIN') {
                return res.status(403).json({
                    error: 'Action réservée aux administrateurs'
                });
            }

            const order = await orderService.restoreOrder(id);

            res.json({
                success: true,
                data: order,
                message: 'Commande restaurée'
            });
        } catch (error) {
            if (error.message.includes('non trouvée')) {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    }
}

module.exports = new OrderController();