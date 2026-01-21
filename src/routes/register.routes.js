const express = require('express');
const router = express.Router();
const { createRegistration, getRegistrationById } = require('../controllers/register.controller');

/**
 * @route   POST /api/register
 * @desc    Create new registration
 * @access  Public
 */
router.post('/', createRegistration);

/**
 * @route   GET /api/register/:id
 * @desc    Get registration by ID
 * @access  Public (will be protected in future phases)
 */
router.get('/:id', getRegistrationById);

module.exports = router;
