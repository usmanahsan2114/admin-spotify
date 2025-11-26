const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const logins = [
    { type: 'Superadmin', email: 'superadmin@shopifyadmin.pk', password: 'superadmin123' },
    { type: 'TechHub Admin', email: 'admin@techhub.pk', password: 'admin123' },
    { type: 'Demo User', email: 'demo@demo.shopifyadmin.pk', password: 'demo1234' }
];

async function verifyLogins() {
    console.log('Checking Server Health...');
    try {
        const health = await axios.get(`${API_URL}/health`);
        console.log(`✅ Server Health: ${health.data.status}`);
    } catch (error) {
        console.log(`❌ Server Health Check Failed: ${error.message}`);
        process.exit(1);
    }

    console.log('Starting Login Verification...');
    let allPassed = true;

    for (const login of logins) {
        try {
            console.log(`Testing ${login.type} login...`);
            const response = await axios.post(`${API_URL}/login`, {
                email: login.email,
                password: login.password
            });

            if (response.status === 200 && response.data.token) {
                console.log(`✅ ${login.type} Login Successful!`);
                console.log(`   User: ${response.data.user.name} (${response.data.user.role})`);
            } else {
                console.log(`❌ ${login.type} Login Failed: Invalid response format`);
                allPassed = false;
            }
        } catch (error) {
            console.log(`❌ ${login.type} Login Failed: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
            allPassed = false;
        }
        console.log('---');
    }

    if (allPassed) {
        console.log('🎉 All logins verified successfully!');
    } else {
        console.log('⚠️ Some logins failed.');
        process.exit(1);
    }
}

verifyLogins();
