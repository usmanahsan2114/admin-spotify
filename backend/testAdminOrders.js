const axios = require('axios');

async function testAdminOrders() {
    try {
        console.log('Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/login', {
            email: 'admin@techhub.pk',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('Login successful. Token received.');
        console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));

        console.log('Fetching orders...');
        const ordersResponse = await axios.get('http://localhost:5000/api/orders?limit=10&offset=0', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Orders response status:', ordersResponse.status);
        console.log('Orders response data type:', typeof ordersResponse.data);
        console.log('Is array?', Array.isArray(ordersResponse.data));

        if (!Array.isArray(ordersResponse.data)) {
            console.log('Data keys:', Object.keys(ordersResponse.data));
            if (ordersResponse.data.data) {
                console.log('Has .data property. Is .data array?', Array.isArray(ordersResponse.data.data));
            }
        } else {
            console.log('First order sample:', JSON.stringify(ordersResponse.data[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAdminOrders();
