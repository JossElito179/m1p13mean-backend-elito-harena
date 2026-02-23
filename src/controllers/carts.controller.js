const cartService = require('../services/carts.service');


    
    const getCart = async (req, res, next) => {
        try {
            const result = await cartService.getCart(req.user.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    const addItem = async (req, res, next) => {
        try {
            const { productId, quantity } = req.body;
            
            if (!productId || !quantity) {
                return res.status(400).json({
                    error: 'productId et quantity sont requis'
                });
            }

            if (quantity < 1) {
                return res.status(400).json({
                    error: 'La quantité doit être supérieure à 0'
                });
            }

            const result = await cartService.addItem(
                req.user.id,
                productId,
                quantity
            );
            
            res.status(201).json(result);
        } catch (error) {
            if (error.message.includes('non trouvé')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('disponible') || 
                error.message.includes('Stock')) {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    }

    const updateQuantity = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { quantity } = req.body;

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    error: 'La quantité doit être supérieure à 0'
                });
            }

            const result = await cartService.updateItemQuantity(
                req.user.id,
                productId,
                quantity
            );
            
            res.json(result);
        } catch (error) {
            if (error.message.includes('non trouvé')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Stock')) {
                return res.status(400).json({ error: error.message });
            }
            next(error);
        }
    }

    const removeItem = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const result = await cartService.removeItem(req.user.id, productId);
            res.json(result);
        } catch (error) {
            if (error.message.includes('non trouvé')) {
                return res.status(404).json({ error: error.message });
            }
            next(error);
        }
    }

    const clearCart = async (req, res, next) => {
        try {
            const result = await cartService.clearCart(req.user.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    const confirmOrder = async (req, res, next) => {
        try {
            const result = await cartService.confirmOrder(req.user.id);
            res.status(201).json(result);
        } catch (error) {
            if (error.message.includes('vide')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('disponible') || 
                error.message.includes('Stock') ||
                error.message.includes('prix')) {
                return res.status(409).json({ error: error.message });
            }
            next(error);
        }
    }


module.exports = {
    getCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    confirmOrder
};