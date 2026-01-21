const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    adminLogin,
    getRegistrations,
    getRegistrationById,
    getDashboardStats
} = require('../controllers/admin.controller');

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', adminLogin);

/**
 * @route   GET /api/admin/registrations
 * @desc    Get all registrations
 * @access  Private (Admin only)
 */
router.get('/registrations', authMiddleware, getRegistrations);

/**
 * @route   GET /api/admin/registrations/:id
 * @desc    Get registration by ID
 * @access  Private (Admin only)
 */
router.get('/registrations/:id', authMiddleware, getRegistrationById);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authMiddleware, getDashboardStats);

module.exports = router;
