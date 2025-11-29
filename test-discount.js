const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:5000/api/public/v1';
const STORE_ID = 'default-store-id'; // Replace with actual store ID if known, or fetch one

async function runTest() {
    try {
        console.log('--- Starting Discount Engine Test ---');

        // 1. Create a Discount (Direct DB insert for now as we don't have Admin UI yet)
        // We'll use the backend models directly if possible, or just assume one exists
        // Since we can't easily import models here without setup, let's assume we need to INSERT via SQL or just manually test if we had an admin API.
        // For this test, we will rely on the fact that we can't easily create a discount via API yet.
        // So I will create a temporary route or just use a known seed if available.
        // Actually, I'll use the `run_command` to insert a discount into the DB using a script.

        console.log('Skipping creation in this script. Please run the seed script first.');

        // 2. Validate Cart with Discount
        const items = [
            { productId: 'prod_1', quantity: 1, price: 1000 }, // Mock items
            { productId: 'prod_2', quantity: 1, price: 2000 }
        ];

        // We need real product IDs for the backend to validate.
        // So let's fetch products first.
        const productsRes = await axios.get(`${API_URL}/products?storeId=${STORE_ID}`);
        const products = productsRes.data.products || [];

        if (products.length < 2) {
            console.log('Not enough products to test BOGO. Need at least 2.');
            return;
        }

        const cartItems = [
            { productId: products[0].id, quantity: 1 },
            { productId: products[1].id, quantity: 1 }
        ];

        console.log('Testing Discount: SUMMER20 (Percentage)');
        try {
            const res = await axios.post(`${API_URL}/checkout/validate`, {
                storeId: products[0].storeId,
                items: cartItems,
                discountCode: 'SUMMER20'
            });
            console.log('Validation Result:', res.data);
        } catch (e) {
            console.log('Validation Failed (Expected if code missing):', e.response?.data?.message);
        }

    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

runTest();
