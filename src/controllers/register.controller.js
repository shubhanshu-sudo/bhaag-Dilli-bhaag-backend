const Registration = require('../models/Registration');

/**
 * @desc    Create new registration
 * @route   POST /api/register
 * @access  Public
 */
const createRegistration = async (req, res) => {
    try {
        const { name, email, phone, race, tshirtSize, amount } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !race || !tshirtSize || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if email already registered
        const existingRegistration = await Registration.findOne({ email });
        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Create new registration
        const registration = await Registration.create({
            name,
            email,
            phone,
            race,
            tshirtSize,
            amount,
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
