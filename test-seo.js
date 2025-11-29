const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api/public/v1';

async function runTest() {
    try {
        console.log('--- Starting SEO Test ---');

        // 1. Get Products and check SEO fields
        console.log('Fetching Products...');
        try {
            const res = await axios.get(`${API_URL}/products`);
            const product = res.data.products.find(p => p.slug === 'test-product-seo');
            if (product) {
                console.log('Product SEO Found:', product.slug, product.metaTitle);
            } else {
                console.log('Product with slug test-product-seo not found in list.');
            }
        } catch (e) {
            console.log('Fetch Products Failed:', e.message);
        }

        // 2. Get Category by Slug
        console.log('Fetching Category /categories/summer-collection...');
        try {
            const res = await axios.get(`${API_URL}/categories/summer-collection`);
            console.log('Category SEO:', res.data.metaTitle);
        } catch (e) {
            console.log('Fetch Category Failed:', e.response?.data?.message || e.message);
        }

    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

runTest();
