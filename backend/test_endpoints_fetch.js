// Using built-in fetch

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
    try {
        console.log('Testing endpoints against', BASE_URL);

        // Login as Demo
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@demo.shopifyadmin.pk', password: 'demo123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', loginRes.status, await loginRes.text());
            process.exit(1);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful, token obtained.');

        const endpoints = [
            '/api/metrics/overview',
            '/api/metrics/low-stock-trend',
            '/api/metrics/sales-over-time',
            '/api/metrics/growth-comparison',
            '/api/reports/growth',
            '/api/reports/trends'
        ];

        for (const endpoint of endpoints) {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                console.log(`✅ ${endpoint} - OK`);
            } else {
                console.error(`❌ ${endpoint} - Failed: ${res.status}`, await res.text());
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testEndpoints();
