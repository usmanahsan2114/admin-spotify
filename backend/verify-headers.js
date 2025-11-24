const http = require('http');

const checkUrl = (url) => {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            console.log(`\nURL: ${url}`);
            console.log(`Status: ${res.statusCode}`);
            console.log('Cache-Control:', res.headers['cache-control']);
            res.resume();
            resolve();
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            reject(e);
        });
    });
};

const run = async () => {
    try {
        const endpoints = [
            'http://localhost:5000/api/products/public',
            'http://localhost:5000/api/settings/business/public'
        ];
        for (const url of endpoints) {
            await checkUrl(url);
        }
    } catch (error) {
        console.error(error);
    }
};

run();
