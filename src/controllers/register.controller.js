const Registration = require('../models/Registration');
const { getRacePrice, isValidRaceCategory } = require('../config/raceConfig');

/**
 * @desc    Check email and return existing registration or create draft
 * @route   POST /api/register/check-email
 * @access  Public
 */
const checkEmail = async (req, res) => {
    try {
        const { email, race } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }

        // Find latest registration by email
        // We sort by createdAt: -1 to get the most recent one if multiple exist
        const registration = await Registration.findOne({ email }).sort({ createdAt: -1 });

        if (registration) {
            // Case 2: Already Paid
            if (registration.paymentStatus === 'paid') {
                return res.json({
                    success: true,
                    exists: true,
                    alreadyPaid: true
                });
            }

            // Case 1: Pending registration (abandoned / draft)
            return res.json({
                success: true,
                exists: true,
                registrationId: registration._id,
                data: {
                    name: registration.name,
                    email: registration.email,
                    phone: registration.phone || '',
                    tshirtSize: registration.tshirtSize || '',
                    gender: registration.gender || '',
                    dob: registration.dob ? registration.dob.toISOString().split('T')[0] : '',
                    emergencyName: registration.emergencyName || '',
                    emergencyPhone: registration.emergencyPhone || '',
                    race: registration.race || race
                }
            });
        }

        // Case 3: New user - DO NOT create a document yet.
        // We only check, we don't save until the full form is submitted.
        return res.json({
            success: true,
            exists: false,
            message: 'New registration'
        });

    } catch (error) {
        console.error('Check Email Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify email. Please try again.'
        });
    }
};

/**
 * @desc    Create/Update registration (Full Form Submission)
 * @route   POST /api/register
 * @access  Public
 */
const createRegistration = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            race,
            tshirtSize,
            gender,
            dob,
            emergencyName,
            emergencyPhone,
            raceTitle,
            raceDistance
        } = req.body;

        // Validate required fields (at this stage, they are required)
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

        // Get correct price from backend config
        const correctPrice = getRacePrice(race);

        console.log('📝 Incoming Registration Payload:', {
            name, email, phone, race, step: 'form_completed'
        });

        // Check for existing pending registration to update
        let registration = null;

        const regId = req.body.registrationId;
        if (regId) {
            registration = await Registration.findOne({
                _id: regId,
                paymentStatus: 'pending'
            });
        }

        if (!registration) {
            registration = await Registration.findOne({
                email,
                paymentStatus: 'pending'
            }).sort({ createdAt: -1 });
        }

        if (registration) {
            // Update existing record
            registration.name = name;
            registration.phone = phone;
            registration.race = race;
            registration.tshirtSize = tshirtSize;
            registration.amount = correctPrice;
            registration.gender = gender;
            registration.dob = dob;
            registration.emergencyName = emergencyName;
            registration.emergencyPhone = emergencyPhone;
            registration.raceTitle = raceTitle;
            registration.raceDistance = raceDistance;
            registration.step = 'form_completed';
            await registration.save();
        } else {
            // Double check if paid registration exists (to avoid duplicate payment)
            const paidExists = await Registration.findOne({ email, paymentStatus: 'paid' });
            if (paidExists) {
                return res.status(400).json({
                    success: false,
                    alreadyPaid: true,
                    message: 'You have already registered for this race.'
                });
            }

            // Create new if no draft found (though normal flow should find one)
            registration = await Registration.create({
                name,
                email,
                phone,
                race,
                tshirtSize,
                amount: correctPrice,
                gender,
                dob,
                emergencyName,
                emergencyPhone,
                raceTitle,
                raceDistance,
                paymentStatus: 'pending',
                step: 'form_completed'
            });
        }

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Registration data captured successfully',
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

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.'
        });
    }
};

/**
 * @desc    Get registration by ID
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
    checkEmail,
    createRegistration,
    getRegistrationById
};
