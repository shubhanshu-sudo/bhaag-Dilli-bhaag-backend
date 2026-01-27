/**
 * Race Configuration - Backend Source of Truth
 * This config ensures price consistency and prevents frontend manipulation
 */

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

module.exports = {
    RACE_CONFIG,
    getRaceConfig,
    getRacePrice,
    isValidRaceCategory,
    getValidRaceCategories
};
