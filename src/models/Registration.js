const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
        default: null
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
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
        default: null
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
        enum: {
            values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            message: 'Invalid T-shirt size'
        },
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: null
    },
    dob: {
        type: Date,
        default: null
    },
    emergencyName: {
        type: String,
        trim: true,
        default: null
    },
    emergencyPhone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
        default: null
    },

    // Payment Information
    amount: {
        type: Number,
        default: 0,
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
    confirmationEmailSent: {
        type: Boolean,
        default: false
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

    // Registration Step tracking
    step: {
        type: String,
        enum: ['email_captured', 'form_completed', 'completed'],
        default: 'form_completed'
    },

    // Additional metadata for reference
    raceTitle: {
        type: String,
        default: null
    },
    raceDistance: {
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
registrationSchema.index({ paymentStatus: 1 }); // For admin filtering
registrationSchema.index({ race: 1 }); // For admin filtering
registrationSchema.index({ paymentStatus: 1, createdAt: -1 }); // Compound index for common queries

// Pre-save middleware to update the updatedAt field
registrationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
