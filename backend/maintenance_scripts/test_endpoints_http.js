const http = require('http');

const postData = JSON.stringify({
    email: 'demo@demo.shopifyadmin.pk',
    password: 'demo123'
});

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            const token = JSON.parse(data).token;
            console.log('Login successful');
            testEndpoints(token);
        } else {
            console.error('Login failed:', res.statusCode, data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();

function testEndpoints(token) {
    const endpoints = [
        '/api/metrics/overview',
        '/api/orders',
        '/api/customers',
        '/api/returns',
        '/api/products'
    ];

    endpoints.forEach(endpoint => {
        const opts = {
            hostname: '127.0.0.1',
            port: 5000,
            path: endpoint,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (endpoint === '/api/metrics/overview') {
                    console.log(`Response for ${endpoint}:`, data);
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ ${endpoint} - OK`);
                } else {
                    console.error(`❌ ${endpoint} - Failed: ${res.statusCode}`);
                    console.error(data.substring(0, 500)); // Print first 500 chars
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ ${endpoint} - Error: ${e.message}`);
        });

        req.end();
    });
}
