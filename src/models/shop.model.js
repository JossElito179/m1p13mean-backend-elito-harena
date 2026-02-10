const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        location: {
            floor: {
                type: Number,
                required: true,
                min: 0,
                max: 10
            },
            zone: {
                type: String,
                required: true,
                trim: true,
                uppercase: true,
                match: /^[A-Z]\d{1,3}$/
            }
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        categories: [{
            type: String,
            uppercase: true,
            trim: true
        }],
        isOpen: {
            type: Boolean,
            default: true
        },
        imagePath: {
            type: String,
            default: 'default-shop.png'
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

shopSchema.index({ name: 'text', description: 'text' });
shopSchema.index({ ownerId: 1 });
shopSchema.index({ 'location.floor': 1, 'location.zone': 1 });
shopSchema.index({ categories: 1 });
shopSchema.index({ deletedAt: 1 });

shopSchema.virtual('owner', {
    ref: 'User',
    localField: 'ownerId',
    foreignField: '_id',
    justOne: true
});

shopSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('Shop', shopSchema);