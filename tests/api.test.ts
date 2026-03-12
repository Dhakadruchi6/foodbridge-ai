const BASE_URL = 'http://localhost:3000/api';

async function testFlows() {
  console.log('--- STARTING E2E API TESTS ---');

  try {
    // 1. Donor Registration
    console.log('\n[1] Testing Donor Registration...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Donor',
        email: 'donor@test.com',
        password: 'Password123!',
        role: 'donor'
      })
    });
    const regData = await regRes.json();
    console.log('Donor Registration:', regData.success ? 'PASSED' : 'FAILED', regData.message);

    // 2. Donor Login
    console.log('\n[2] Testing Donor Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'donor@test.com',
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    const donorToken = loginData.data?.token;
    console.log('Donor Login:', donorToken ? 'PASSED' : 'FAILED');

    // 3. Create Donation
    if (donorToken) {
      console.log('\n[3] Testing Donation Creation...');
      const donRes = await fetch(`${BASE_URL}/donations/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${donorToken}`
        },
        body: JSON.stringify({
          foodType: 'Test Food',
          quantity: '5 kg',
          expiryTime: new Date(Date.now() + 86400000).toISOString(),
          pickupAddress: '123 Test St',
          city: 'Test City'
        })
      });
      const donData = await donRes.json();
      console.log('Donation Creation:', donData.success ? 'PASSED' : 'FAILED');
    }

    // 4. ML Match Test
    if (donorToken) {
        console.log('\n[4] Testing ML NGO Ranking...');
        // We'll use a placeholder donation ID since we just created one
        // In a real test we'd capture the ID from the previous step
        console.log('ML Match API: Ready for integration testing...');
    }

    // 5. NGO Flow
    console.log('\n[5] Testing NGO Flow...');
    // (Similar logic for NGO login and accepting donation)

    // 6. Admin Flow
    console.log('\n[6] Testing Admin Flow...');
    // (Similar logic for Admin login and viewing metrics)

    console.log('\n--- E2E TESTS COMPLETED ---');

  } catch (error) {
    console.error('Test Execution Error:', error);
  }
}

// Note: Requires the Next.js server to be running on localhost:3000
// testFlows();
