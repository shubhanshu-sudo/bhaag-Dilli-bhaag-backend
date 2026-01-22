/**
 * Test Script for Payment API
 * 
 * This script demonstrates how to test the /api/payments/create-order endpoint
 * Run this file with: node test-payment-api.js
 */

const BASE_URL = 'http://localhost:5000';

// Test cases
const testCases = [
    {
        name: 'Valid 2KM Race',
        data: { raceCategory: '2KM' },
        expectedAmount: 499
    },
    {
        name: 'Valid 5KM Race',
        data: { raceCategory: '5KM' },
        expectedAmount: 699
    },
    {
        name: 'Valid 10KM Race',
        data: { raceCategory: '10KM' },
        expectedAmount: 1199
    },
    {
        name: 'Invalid Race Category',
        data: { raceCategory: '15KM' },
        shouldFail: true
    },
    {
        name: 'Missing Race Category',
        data: {},
        shouldFail: true
    }
];

async function testCreateOrder(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('Request:', JSON.stringify(testCase.data, null, 2));

    try {
        const response = await fetch(`${BASE_URL}/api/payments/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testCase.data)
        });

        const result = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        // Validate response
        if (testCase.shouldFail) {
            if (!response.ok) {
                console.log('✅ Test passed: Expected failure occurred');
            } else {
                console.log('❌ Test failed: Should have failed but succeeded');
            }
        } else {
            if (response.ok && result.success) {
                if (result.amount === testCase.expectedAmount) {
                    console.log('✅ Test passed: Correct amount returned');
                } else {
                    console.log(`❌ Test failed: Expected amount ${testCase.expectedAmount}, got ${result.amount}`);
                }
            } else {
                console.log('❌ Test failed: Request should have succeeded');
            }
        }

    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Payment API Tests');
    console.log('='.repeat(50));

    for (const testCase of testCases) {
        await testCreateOrder(testCase);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ All tests completed');
}

// Run tests
runAllTests();
