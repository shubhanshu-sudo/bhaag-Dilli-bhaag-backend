const Registration = require('../models/Registration');
const { getRacePrice, isValidRaceCategory } = require('../config/raceConfig');

/**
 * @desc    Create new registration
 * @route   POST /api/register
 * @access  Public
 */
const createRegistration = async (req, res) => {
    try {
        const { name, email, phone, race, tshirtSize, amount } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !race || !tshirtSize) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate race category
        if (!isValidRaceCategory(race)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid race category. Must be 2KM, 5KM, or 10KM'
            });
        }

        // Get correct price from backend config (SECURITY: Don't trust frontend)
        const correctPrice = getRacePrice(race);

        // Validate frontend-sent amount matches backend price
        if (amount && amount !== correctPrice) {
            console.warn(`Price mismatch detected for ${race}: Frontend sent ${amount}, Backend expects ${correctPrice}`);
            // We'll use the backend price regardless
        }

        // Check if email already registered
        const existingRegistration = await Registration.findOne({ email });
        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Create new registration with backend-calculated price
        const registration = await Registration.create({
            name,
            email,
            phone,
            race,
            tshirtSize,
            amount: correctPrice, // Always use backend price
            paymentStatus: 'pending'
        });

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            registrationId: registration._id,
            data: {
                name: registration.name,
                email: registration.email,
                race: registration.race,
                amount: registration.amount,
                paymentStatus: registration.paymentStatus
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.'
        });
    }
};

/**
 * @desc    Get registration by ID (for future use)
 * @route   GET /api/register/:id
 * @access  Public
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

module.exports = {
    createRegistration,
    getRegistrationById
};
