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

module.exports = {
    adminLogin,
    getRegistrations,
    getRegistrationById,
    getDashboardStats
};
