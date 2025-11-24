const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products/public',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY LENGTH:', data.length);
        if (res.statusCode === 200) {
            console.log('SUCCESS: API returned 200 OK');
            try {
                const products = JSON.parse(data);
                console.log(`Received ${products.length} products`);
            } catch (e) {
                console.log('Error parsing JSON:', e.message);
            }
        } else {
            console.log('FAILURE: API returned non-200 status');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
