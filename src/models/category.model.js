const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true
        },

        label: {
            type: String,
            required: true,
            trim: true
        },

        icon: {
            type: String,
        },

        isActive: {
            type: Boolean,
            default: true
        },

        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

categorySchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('Category', categorySchema);