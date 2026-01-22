const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },

    // Race Details
    race: {
        type: String,
        required: [true, 'Race category is required'],
        enum: {
            values: ['2KM', '5KM', '10KM'],
            message: 'Race must be either 2KM, 5KM, or 10KM'
        }
    },
    tshirtSize: {
        type: String,
        required: [true, 'T-shirt size is required'],
        enum: {
            values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            message: 'Invalid T-shirt size'
        }
    },

    // Payment Information
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },

    // Razorpay Payment Fields
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    paymentDate: {
        type: Date,
        default: null
    },

    // Legacy fields (for backward compatibility)
    paymentId: {
        type: String,
        default: null
    },
    transactionId: {
        type: String,
        default: null
    },
    orderId: {
        type: String,
        default: null
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

// Index for faster queries
registrationSchema.index({ email: 1 });
registrationSchema.index({ phone: 1 });
registrationSchema.index({ createdAt: -1 });

// Pre-save middleware to update the updatedAt field
registrationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
