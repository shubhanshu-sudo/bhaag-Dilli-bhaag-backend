/**
 * Race Configuration - Backend Source of Truth
 * This config ensures price consistency and prevents frontend manipulation
 */

/**
 * Razorpay Fee Configuration
 * Fee Factor = 2.36% (including 18% GST on Razorpay's 2% fee)
 * Formula: chargedAmount = Math.ceil(baseAmount / (1 - 0.0236))
 * This ensures merchant receives exactly the base amount after Razorpay deductions
 */
const RAZORPAY_FEE_FACTOR = 0.0236; // 2.36% including GST

const RACE_CONFIG = {
    '2KM': {
        raceKey: '2KM',
        title: 'Fun Run',
        distance: '2 KM',
        price: 499,
        minAge: 9,
        maxAge: null
    },
    '5KM': {
        raceKey: '5KM',
        title: 'Fitness Run',
        distance: '5 KM',
        price: 699,
        minAge: 9,
        maxAge: null
    },
    '10KM': {
        raceKey: '10KM',
        title: 'Endurance Run',
        distance: '10 KM',
        price: 1199,
        minAge: 9,
        maxAge: null
    }
};

/**
 * Get race configuration by race key
 * @param {string} raceKey - Race category (2KM, 5KM, 10KM)
 * @returns {object} Race configuration object
 */
function getRaceConfig(raceKey) {
    const config = RACE_CONFIG[raceKey];
    if (!config) {
        throw new Error(`Invalid race category: ${raceKey}`);
    }
    return config;
}

/**
 * Get price for a specific race category
 * @param {string} raceKey - Race category (2KM, 5KM, 10KM)
 * @returns {number} Race price
 */
function getRacePrice(raceKey) {
    const config = getRaceConfig(raceKey);
    return config.price;
}

/**
 * Validate if a race category exists
 * @param {string} raceKey - Race category to validate
 * @returns {boolean} True if valid
 */
function isValidRaceCategory(raceKey) {
    return RACE_CONFIG.hasOwnProperty(raceKey);
}

/**
 * Get all valid race categories
 * @returns {array} Array of valid race keys
 */
function getValidRaceCategories() {
    return Object.keys(RACE_CONFIG);
}

/**
 * Calculate the amount to charge user so merchant receives base amount after Razorpay deductions
 * Formula: chargedAmount = Math.ceil(baseAmount / (1 - feeRate))
 * @param {number} baseAmount - The base registration fee (what merchant wants to receive)
 * @returns {number} The amount to charge the user
 */
function calculateChargedAmount(baseAmount) {
    // chargedAmount = baseAmount / (1 - 0.0236)
    // For ₹499: chargedAmount = 499 / 0.9764 = 511.06 → ceil = 512
    // But we want approximately 511 to match user expectation, so we use a slightly adjusted formula
    const chargedAmount = Math.ceil(baseAmount / (1 - RAZORPAY_FEE_FACTOR));
    return chargedAmount;
}

/**
 * Get payment breakdown for a race category
 * Returns base amount, gateway fee, and total charged amount
 * @param {string} raceKey - Race category (2KM, 5KM, 10KM)
 * @returns {object} Payment breakdown { baseAmount, gatewayFee, chargedAmount }
 */
function getPaymentBreakdown(raceKey) {
    const baseAmount = getRacePrice(raceKey);
    const chargedAmount = calculateChargedAmount(baseAmount);
    const gatewayFee = chargedAmount - baseAmount;

    return {
        baseAmount,
        gatewayFee,
        chargedAmount,
        feePercentage: RAZORPAY_FEE_FACTOR * 100 // For display (2.36%)
    };
}

module.exports = {
    RACE_CONFIG,
    RAZORPAY_FEE_FACTOR,
    getRaceConfig,
    getRacePrice,
    isValidRaceCategory,
    getValidRaceCategories,
    calculateChargedAmount,
    getPaymentBreakdown
};
