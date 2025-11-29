const axios = require('axios');

const API_URL = 'http://localhost:5000/api/public/v1';

async function runTest() {
    try {
        console.log('--- Starting CMS Test ---');

        // 1. Get Page
        console.log('Fetching /pages/about-us...');
        try {
            const pageRes = await axios.get(`${API_URL}/pages/about-us`);
            console.log('Page Title:', pageRes.data.title);
            console.log('Page Content:', pageRes.data.content.substring(0, 50) + '...');
        } catch (e) {
            console.log('Fetch Page Failed:', e.response?.data?.message || e.message);
        }

        // 2. Get Blog Posts
        console.log('Fetching /blogs...');
        try {
            const blogRes = await axios.get(`${API_URL}/blogs`);
            console.log('Total Posts:', blogRes.data.total);
            if (blogRes.data.posts.length > 0) {
                console.log('First Post:', blogRes.data.posts[0].title);
            }
        } catch (e) {
            console.log('Fetch Blogs Failed:', e.response?.data?.message || e.message);
        }

    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

runTest();
