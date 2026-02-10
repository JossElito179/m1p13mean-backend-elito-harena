const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        categories: [{
            type: String,
            uppercase: true,
            trim: true
        }],
        price: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'MGA',
            uppercase: true,
            enum: ['MGA', 'USD', 'EUR']
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        },
        imagePaths: [{
            type: String,
            default: []
        }],
        status: {
            type: String,
            enum: ['DRAFT', 'PUBLISHED', 'INACTIVE'],
            default: 'DRAFT'
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

productSchema.index({ shopId: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ deletedAt: 1 });

productSchema.virtual('shop', {
    ref: 'Shop',
    localField: 'shopId',
    foreignField: '_id',
    justOne: true
});

productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;