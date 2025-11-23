const request = require('supertest');
const app = require('./server'); // Assuming server.js exports app
const { db, initializeDatabase } = require('./db/init');

async function testEndpoints() {
    try {
        await initializeDatabase();

        // Login as Demo
        const loginRes = await request(app)
            .post('/api/login')
            .send({ email: 'demo@demo.shopifyadmin.pk', password: 'demo123' });

        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes.status, loginRes.body);
            process.exit(1);
        }

        const token = loginRes.body.token;
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
            const res = await request(app)
                .get(endpoint)
                .set('Authorization', `Bearer ${token}`);

            if (res.status === 200) {
                console.log(`✅ ${endpoint} - OK`);
            } else {
                console.error(`❌ ${endpoint} - Failed: ${res.status}`, res.body);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testEndpoints();
