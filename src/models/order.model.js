const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    nameSnapshot: {
        type: String,
        required: true
    },
    priceSnapshot: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    items: [OrderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'MGA'
    },
    status: {
        type: String,
        enum: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'],
        default: 'CONFIRMED'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

OrderSchema.index({ userId: 1 });
OrderSchema.index({ shopId: 1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);