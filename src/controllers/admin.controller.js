const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Registration = require('../models/Registration');

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
 * @desc    Get all registrations
 * @route   GET /api/admin/registrations
 * @access  Private (Admin only)
 */
const getRegistrations = async (req, res) => {
    try {
        // Fetch all registrations, sorted by latest first
        const registrations = await Registration.find()
            .sort({ createdAt: -1 })
            .select('-__v'); // Exclude version key

        // Get statistics
        const stats = {
            total: registrations.length,
            pending: registrations.filter(r => r.paymentStatus === 'pending').length,
            completed: registrations.filter(r => r.paymentStatus === 'completed').length,
            failed: registrations.filter(r => r.paymentStatus === 'failed').length,
            byRace: {
                '2KM': registrations.filter(r => r.race === '2KM').length,
                '5KM': registrations.filter(r => r.race === '5KM').length,
                '10KM': registrations.filter(r => r.race === '10KM').length
            }
        };

        res.status(200).json({
            success: true,
            count: registrations.length,
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
        const registration = await Registration.findById(req.params.id);

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
        const completedPayments = await Registration.countDocuments({ paymentStatus: 'completed' });

        // Revenue calculation (only completed payments)
        const completedRegs = await Registration.find({ paymentStatus: 'completed' });
        const totalRevenue = completedRegs.reduce((sum, reg) => sum + (reg.amount || 0), 0);

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
                completedPayments,
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

module.exports = {
    adminLogin,
    getRegistrations,
    getRegistrationById,
    getDashboardStats
};
