const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        priceSnapshot: {
            type: Number,
            required: true
        },
        currencySnapshot: {
            type: String,
            default: 'MGA',
            uppercase: true
        },
        nameSnapshot: {
            type: String,
            required: true
        }
    }
);

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: {
        type: [CartItemSchema],
        default: []
    }
}, {
    timestamps: true
});

CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.productId': 1 });
CartSchema.index({ 'items.shopId': 1 });

module.exports = mongoose.model('Cart', CartSchema);