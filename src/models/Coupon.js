const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    discountType: {
        type: String,
        required: [true, 'Discount type is required'],
        enum: {
            values: ['PERCENT'],
            message: 'Discount type must be PERCENT'
        },
        default: 'PERCENT'
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        max: [100, 'Discount value cannot exceed 100'],
        min: [0, 'Discount value cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: false
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxUsage: {
        type: Number,
        default: null
    },
    reservedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster lookups
couponSchema.index({ isActive: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
