const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    adminLogin,
    getRegistrations,
    getRegistrationById,
    getDashboardStats,
    createCoupon,
    getCoupons,
    toggleCouponStatus,
    deleteCoupon
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

/**
 * @route   POST /api/admin/coupons
 * @desc    Create a new coupon
 * @access  Private (Admin only)
 */
router.post('/coupons', authMiddleware, createCoupon);

/**
 * @route   GET /api/admin/coupons
 * @desc    Get all coupons
 * @access  Private (Admin only)
 */
router.get('/coupons', authMiddleware, getCoupons);

/**
 * @route   PATCH /api/admin/coupons/:id/status
 * @desc    Toggle coupon active status
 * @access  Private (Admin only)
 */
router.patch('/coupons/:id/status', authMiddleware, toggleCouponStatus);

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Delete a coupon
 * @access  Private (Admin only)
 */
router.delete('/coupons/:id', authMiddleware, deleteCoupon);

module.exports = router;
