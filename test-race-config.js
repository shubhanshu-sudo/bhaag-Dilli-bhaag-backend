/**
 * Test Script for Race Price Configuration
 * Run this to verify backend price calculations are working correctly
 */

const {
    getRaceConfig,
    getRacePrice,
    isValidRaceCategory,
    getValidRaceCategories
} = require('./src/config/raceConfig');

console.log('🧪 Testing Backend Race Configuration\n');
console.log('='.repeat(60));

// Test 1: Get all valid categories
console.log('\n✅ Test 1: Valid Race Categories');
console.log('Valid categories:', getValidRaceCategories());

// Test 2: Get prices for each category
console.log('\n✅ Test 2: Race Prices');
['2KM', '5KM', '10KM'].forEach(race => {
    try {
        const price = getRacePrice(race);
        console.log(`${race}: ₹${price}`);
    } catch (error) {
        console.error(`❌ Error getting price for ${race}:`, error.message);
    }
});

// Test 3: Get full config for each race
console.log('\n✅ Test 3: Full Race Configurations');
['2KM', '5KM', '10KM'].forEach(race => {
    try {
        const config = getRaceConfig(race);
        console.log(`\n${race}:`, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error(`❌ Error getting config for ${race}:`, error.message);
    }
});

// Test 4: Validate race categories
console.log('\n✅ Test 4: Race Category Validation');
['2KM', '5KM', '10KM', 'INVALID', '1KM'].forEach(race => {
    const isValid = isValidRaceCategory(race);
    console.log(`${race}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test 5: Verify new 10KM price
console.log('\n✅ Test 5: Verify 10KM Price Update');
const tenKmPrice = getRacePrice('10KM');
const expectedPrice = 1199;
if (tenKmPrice === expectedPrice) {
    console.log(`✅ SUCCESS: 10KM price is correctly set to ₹${tenKmPrice}`);
} else {
    console.log(`❌ FAILED: 10KM price is ₹${tenKmPrice}, expected ₹${expectedPrice}`);
}

// Test 6: Error handling
console.log('\n✅ Test 6: Error Handling');
try {
    getRacePrice('INVALID_RACE');
    console.log('❌ FAILED: Should have thrown error for invalid race');
} catch (error) {
    console.log('✅ SUCCESS: Correctly throws error for invalid race');
    console.log('   Error message:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 All tests completed!\n');

// Summary
console.log('📊 PRICE SUMMARY:');
console.log('   2 KM Fun Run:       ₹499');
console.log('   5 KM Fitness Run:   ₹699');
console.log('   10 KM Endurance:    ₹1199 (Updated from ₹999)');
console.log('');
