const fetch = require('node-fetch');

const TEST_FOOD_URL = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000'; // Bowl of salad/food
const TEST_NON_FOOD_URL = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000'; // Watch/Gadget

async function testVision(url, label) {
    console.log(`\n--- Testing ${label} ---`);
    console.log(`URL: ${url}`);

    try {
        const response = await fetch('http://localhost:3000/api/ml/detect-food', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We need to bypass auth for this test script or provide a token
                // For simplicity, I'll temporarily disable auth requirement in the API for this test or use a dummy token if the middleware allows
            },
            body: JSON.stringify({ imageUrl: url, claimedCategory: 'Test' })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

async function runTests() {
    await testVision(TEST_FOOD_URL, 'FOOD IMAGE');
    await testVision(TEST_NON_FOOD_URL, 'NON-FOOD IMAGE');
}

runTests();
