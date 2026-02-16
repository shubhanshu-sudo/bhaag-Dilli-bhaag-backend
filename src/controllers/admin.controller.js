const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Registration = require('../models/Registration');
const Coupon = require('../models/Coupon');

/**
 * @desc    Admin login
 * @route   POST /api/admin/login
 * @access  Public
 */
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Compare password
        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h' // Token expires in 24 hours
            }
        );

        // Return success response
        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again later.'
        });
    }
};

/**
 * @desc    Get all registrations with search, filters, and pagination
 * @route   GET /api/admin/registrations
 * @access  Private (Admin only)
 * @query   ?search=text&status=paid&race=5KM&page=1&limit=20
 */
const getRegistrations = async (req, res) => {
    try {
        // Extract query parameters
        const {
            search = '',
            status = '',
            race = '',
            page = 1,
            limit = 20
        } = req.query;

        // Build query object
        const query = {};

        // Search across multiple fields
        if (search) {
            const searchConditions = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];

            // If search looks like a MongoDB ObjectId, also search by _id
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                searchConditions.push({ _id: search });
            }

            query.$or = searchConditions;
        }

        // Filter by payment status
        if (status && ['pending', 'paid', 'failed'].includes(status)) {
            query.paymentStatus = status;
        }

        // Filter by race category
        if (race && ['2KM', '5KM', '10KM'].includes(race)) {
            query.race = race;
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const totalRecords = await Registration.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / limitNum);

        // Fetch registrations with pagination
        const registrations = await Registration.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .select('-__v');

        // Get statistics (for all data, not just current page)
        const stats = {
            total: await Registration.countDocuments(),
            pending: await Registration.countDocuments({ paymentStatus: 'pending' }),
            paid: await Registration.countDocuments({ paymentStatus: 'paid' }),
            failed: await Registration.countDocuments({ paymentStatus: 'failed' }),
            byRace: {
                '2KM': await Registration.countDocuments({ race: '2KM' }),
                '5KM': await Registration.countDocuments({ race: '5KM' }),
                '10KM': await Registration.countDocuments({ race: '10KM' })
            }
        };

        res.status(200).json({
            success: true,
            count: registrations.length,
            totalRecords,
            totalPages,
            currentPage: pageNum,
            stats,
            data: registrations
        });

    } catch (error) {
        console.error('Get Registrations Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations'
        });
    }
};

/**
 * @desc    Get registration by ID
 * @route   GET /api/admin/registrations/:id
 * @access  Private (Admin only)
 */
const getRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration ID format'
            });
        }

        const registration = await Registration.findById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.status(200).json({
            success: true,
            data: registration
        });

    } catch (error) {
        console.error('Get Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registration'
        });
    }
};

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalRegistrations = await Registration.countDocuments();
        const pendingPayments = await Registration.countDocuments({ paymentStatus: 'pending' });
        const paidPayments = await Registration.countDocuments({ paymentStatus: 'paid' });

        // Revenue calculation (only paid payments)
        const paidRegs = await Registration.find({ paymentStatus: 'paid' });
        const totalRevenue = paidRegs.reduce((sum, reg) => sum + (reg.amount || 0), 0);

        // Race-wise breakdown
        const raceStats = await Registration.aggregate([
            {
                $group: {
                    _id: '$race',
                    count: { $sum: 1 },
                    revenue: { $sum: '$amount' }
                }
            }
        ]);

        // Recent registrations (last 10)
        const recentRegistrations = await Registration.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name email race amount paymentStatus createdAt');

        res.status(200).json({
            success: true,
            stats: {
                totalRegistrations,
                pendingPayments,
                paidPayments,
                totalRevenue,
                raceStats,
                recentRegistrations
            }
        });

    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats'
        });
    }
};

/**
 * @desc    Create a new coupon
 * @route   POST /api/admin/coupons
 * @access  Private (Admin only)
 */
const createCoupon = async (req, res) => {
    try {
        const { code, discountValue, isActive, maxUsage, expiresAt } = req.body;

        // Validation
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required'
            });
        }

        const couponCode = code.toUpperCase().trim();

        // Length validation (5-12 characters)
        if (couponCode.length < 5 || couponCode.length > 12) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code must be between 5 and 12 characters'
            });
        }

        // Alpha-numeric validation (Only A-Z, 0-9)
        const codeRegex = /^[A-Z0-9]+$/;
        if (!codeRegex.test(couponCode)) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code can only contain uppercase letters and numbers'
            });
        }

        if (discountValue === undefined || discountValue === null) {
            return res.status(400).json({
                success: false,
                message: 'Discount value is required'
            });
        }

        if (discountValue > 100) {
            return res.status(400).json({
                success: false,
                message: 'Discount value cannot exceed 100%'
            });
        }

        if (maxUsage !== undefined && maxUsage !== null && maxUsage !== '' && (isNaN(maxUsage) || maxUsage < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Max usage must be a positive number'
            });
        }

        if (expiresAt && new Date(expiresAt) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({
                success: false,
                message: 'Expiry date cannot be in the past'
            });
        }

        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({ code: couponCode });
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists'
            });
        }

        // Create coupon
        const coupon = await Coupon.create({
            code: couponCode,
            discountValue,
            isActive: isActive !== undefined ? isActive : false,
            maxUsage: (maxUsage && maxUsage !== '') ? Number(maxUsage) : null,
            expiresAt: expiresAt || null,
            discountType: 'PERCENT',
            usageCount: 0
        });

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });

    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon'
        });
    }
};

const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .sort({ createdAt: -1 })
            .select('code discountValue isActive usageCount maxUsage expiresAt createdAt');

        res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons
        });

    } catch (error) {
        console.error('Get Coupons Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons'
        });
    }
};

const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined || isActive === null) {
            return res.status(400).json({
                success: false,
                message: 'isActive status is required'
            });
        }

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon ID format'
            });
        }

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        );

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: coupon
        });

    } catch (error) {
        console.error('Toggle Coupon Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon status'
        });
    }
};

/**
 * @desc    Delete a coupon
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private (Admin only)
 */
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon ID format'
            });
        }

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Block deletion if coupon has been used
        if (coupon.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a coupon that has already been used'
            });
        }

        await Coupon.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully'
        });

    } catch (error) {
        console.error('Delete Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coupon'
        });
    }
};

/**
 * @desc    Update a coupon
 * @route   PUT /api/admin/coupons/:id
 * @access  Private (Admin only)
 */
const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountValue, isActive, maxUsage, expiresAt } = req.body;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon ID format'
            });
        }

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Prepare update data
        const updateData = {};

        if (code) {
            const couponCode = code.toUpperCase().trim();
            // Length validation
            if (couponCode.length < 5 || couponCode.length > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code must be between 5 and 12 characters'
                });
            }
            // Alpha-numeric validation
            const codeRegex = /^[A-Z0-9]+$/;
            if (!codeRegex.test(couponCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code can only contain uppercase letters and numbers'
                });
            }
            // Check if code is changed and if new code already exists
            if (couponCode !== coupon.code) {
                const existingCoupon = await Coupon.findOne({ code: couponCode });
                if (existingCoupon) {
                    return res.status(400).json({
                        success: false,
                        message: 'Coupon code already exists'
                    });
                }
                updateData.code = couponCode;
            }
        }

        if (discountValue !== undefined && discountValue !== null) {
            if (discountValue > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount value cannot exceed 100%'
                });
            }
            updateData.discountValue = discountValue;
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        if (maxUsage !== undefined) {
            if (maxUsage !== null && maxUsage !== '' && (isNaN(maxUsage) || maxUsage < 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'Max usage must be a positive number'
                });
            }
            updateData.maxUsage = (maxUsage && maxUsage !== '') ? Number(maxUsage) : null;
        }

        if (expiresAt !== undefined) {
            if (expiresAt && new Date(expiresAt) < new Date(new Date().setHours(0, 0, 0, 0))) {
                return res.status(400).json({
                    success: false,
                    message: 'Expiry date cannot be in the past'
                });
            }
            updateData.expiresAt = expiresAt || null;
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            data: updatedCoupon
        });

    } catch (error) {
        console.error('Update Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon'
        });
    }
};

/**
 * @desc    Resend registration confirmation email manually
 * @route   POST /api/admin/registrations/:id/resend-email
 * @access  Private (Admin only)
 */
const resendRegistrationEmail = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration ID format'
            });
        }

        const registration = await Registration.findById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Only allow resending for paid registrations
        if (registration.paymentStatus !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot send confirmation email for unpaid registrations'
            });
        }

        const { generateInvoice } = require('../utils/invoiceGenerator');
        const { sendRegistrationConfirmation } = require('../utils/emailService');

        console.log(`📧 Manual resend triggered by admin for: ${registration.email}`);

        // Generate PDF invoice
        const invoicePDF = await generateInvoice(registration);

        // Send email
        const result = await sendRegistrationConfirmation(registration, invoicePDF);

        // Update sent flag if it wasn't already set
        if (!registration.confirmationEmailSent) {
            registration.confirmationEmailSent = true;
            await registration.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Confirmation email resent successfully',
            messageId: result.messageId,
            to: registration.email
        });

    } catch (error) {
        console.error('Resend Email Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to resend email'
        });
    }
};

module.exports = {
    adminLogin,
    getRegistrations,
    getRegistrationById,
    getDashboardStats,
    createCoupon,
    getCoupons,
    toggleCouponStatus,
    updateCoupon,
    deleteCoupon,
    resendRegistrationEmail
};
