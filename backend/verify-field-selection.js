const http = require('http');

const checkUrl = (url) => {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`\nURL: ${url}`);
                console.log(`Status: ${res.statusCode}`);
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log('First item keys:', Object.keys(parsed[0]));
                    } else {
                        console.log('Response:', parsed);
                    }
                } catch (e) {
                    console.log('Response is not JSON:', data.substring(0, 100));
                }
                resolve();
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            reject(e);
        });
    });
};

const run = async () => {
    try {
        console.log('Testing Public Endpoint with fields=id,name');
        await checkUrl('http://localhost:5000/api/products/public?fields=id,name');

        console.log('\nTesting Public Endpoint with fields=id,price,stockQuantity');
        await checkUrl('http://localhost:5000/api/products/public?fields=id,price,stockQuantity');

        console.log('\nTesting Public Endpoint with no fields (should return all default fields)');
        await checkUrl('http://localhost:5000/api/products/public');

    } catch (error) {
        console.error(error);
    }
};

run();
