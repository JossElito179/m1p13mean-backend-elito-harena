const Cart = require('../models/carts.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const mongoose = require('mongoose');

class CartService {
    
    async getCart(userId) {
        const cart = await Cart.findOne({ userId })
            .populate('items.productId')
            .populate('items.shopId');

        if (!cart || !cart.items.length) {
            return { shops: [], total: 0 };
        }

        const shopsMap = new Map();
        
        cart.items.forEach(item => {
            const shopId = item.shopId._id.toString();
            const shopName = item.shopId.name || 'Boutique';
            const subtotal = item.priceSnapshot * item.quantity;
            
            if (!shopsMap.has(shopId)) {
                shopsMap.set(shopId, {
                    shopId,
                    shopName,
                    items: [],
                    shopTotal: 0
                });
            }
            
            const shop = shopsMap.get(shopId);
            shop.items.push({
                productId: item.productId._id,
                name: item.nameSnapshot,
                price: item.priceSnapshot,
                quantity: item.quantity,
                subtotal
            });
            shop.shopTotal += subtotal;
        });

        const shops = Array.from(shopsMap.values());
        const total = shops.reduce((sum, shop) => sum + shop.shopTotal, 0);

        return { shops, total };
    }

    async addItem(userId, productId, quantity) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Produit non trouvé');
        }
        
        if (product.status !== 'PUBLISHED') {
            throw new Error('Ce produit n\'est pas disponible');
        }
        
        if (product.stock < quantity) {
            throw new Error('Stock insuffisant');
        }

        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            cart = new Cart({
                userId,
                items: []
            });
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (product.stock < newQuantity) {
                throw new Error('Stock insuffisant pour la quantité demandée');
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            cart.items.push({
                productId,
                shopId: product.shopId,
                quantity,
                priceSnapshot: product.price,
                nameSnapshot: product.name
            });
        }

        await cart.save();
        return this.getCart(userId);
    }

    async updateItemQuantity(userId, productId, quantity) {
        if (quantity < 1) {
            throw new Error('La quantité doit être au moins 1');
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            throw new Error('Panier non trouvé');
        }

        const item = cart.items.find(
            item => item.productId.toString() === productId
        );
        
        if (!item) {
            throw new Error('Produit non trouvé dans le panier');
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Produit non trouvé');
        }

        if (product.stock < quantity) {
            throw new Error('Stock insuffisant');
        }

        item.quantity = quantity;
        await cart.save();

        return this.getCart(userId);
    }

    async removeItem(userId, productId) {
        const cart = await Cart.findOne({ userId });
        
        if (!cart) {
            throw new Error('Panier non trouvé');
        }

        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );

        await cart.save();
        return this.getCart(userId);
    }

    async clearCart(userId) {
        const cart = await Cart.findOne({ userId });
        
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        return { shops: [], total: 0 };
    }

    async confirmOrder(userId) {
        const cart = await Cart.findOne({ userId })
            .populate('items.productId');

        if (!cart || !cart.items.length) {
            throw new Error('Le panier est vide');
        }

        const shopItems = new Map();
        
        for (const item of cart.items) {
            const product = item.productId;
            
            if (!product) {
                throw new Error(`Produit non trouvé: ${item.productId}`);
            }

            if (product.status !== 'PUBLISHED') {
                throw new Error(`Le produit ${product.name} n'est plus disponible`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Stock insuffisant pour ${product.name}`);
            }

            if (product.price !== item.priceSnapshot) {
                throw new Error(`Le prix de ${product.name} a changé. Veuillez rafraîchir votre panier.`);
            }

            const shopId = product.shopId.toString();
            if (!shopItems.has(shopId)) {
                shopItems.set(shopId, []);
            }
            shopItems.get(shopId).push(item);
        }

        const orders = [];
        const errors = [];
        
        for (const [shopId, items] of shopItems) {
            try {
                let totalAmount = 0;
                const orderItems = items.map(item => {
                    const subtotal = item.priceSnapshot * item.quantity;
                    totalAmount += subtotal;
                    
                    return {
                        productId: item.productId._id,
                        nameSnapshot: item.nameSnapshot,
                        priceSnapshot: item.priceSnapshot,
                        quantity: item.quantity,
                        subtotal
                    };
                });

                const order = new Order({
                    userId,
                    shopId,
                    items: orderItems,
                    totalAmount,
                    currency: 'MGA',
                    status: 'CONFIRMED'
                });

                await order.save();

                for (const item of items) {
                    await Product.findByIdAndUpdate(
                        item.productId._id,
                        { $inc: { stock: -item.quantity } }
                    );
                }

                orders.push(order);
            } catch (error) {
                errors.push(`Erreur pour le shop ${shopId}: ${error.message}`);
            }
        }

        if (errors.length > 0) {
            for (const order of orders) {
                await Order.findByIdAndDelete(order._id);
            }
            throw new Error(`Échec de la confirmation: ${errors.join(', ')}`);
        }

        await Cart.findOneAndDelete({ userId });

        return {
            orders: orders.map(order => ({
                orderId: order._id,
                shopId: order.shopId,
                status: order.status,
                totalAmount: order.totalAmount
            }))
        };
    }
}

module.exports = new CartService();