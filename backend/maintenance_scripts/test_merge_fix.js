const { Order, Customer, Store } = require('./db/init').db;

async function testAlternativeMerge() {
    try {
        console.log('Starting Alternative Merge Test...');

        // 1. Setup: Ensure store exists
        let store = await Store.findOne({ where: { name: 'Test Store' } });
        if (!store) {
            store = await Store.create({
                name: 'Test Store',
                domain: 'test-store.com',
                organizationId: 'test-org'
            });
        }

        const testEmail = `test-merge-${Date.now()}@example.com`;
        const initialAddress = '123 Initial St';
        const newAltAddress = '456 Alt Ave';
        const newAltName = 'Alt Name';

        // 2. Create Initial Customer via Order
        const token = require('jsonwebtoken').sign({ userId: 'test-admin', role: 'admin', storeId: store.id }, process.env.JWT_SECRET || 'development-secret-please-change');

        console.log('Creating initial order...');
        const res1 = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                productName: 'Test Product',
                customerName: 'Test Customer Merge',
                email: testEmail,
                quantity: 1,
                address: initialAddress,
                storeId: store.id
            })
        });

        if (!res1.ok) throw new Error(`Order 1 failed: ${JSON.stringify(await res1.json())}`);
        const order1 = await res1.json();
        console.log(`Order 1 created: ${order1.id}`);

        // 3. Create Second Order for SAME customer with NEW alternatives
        console.log('Creating second order with new alternatives...');
        const res2 = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                productName: 'Test Product 2',
                customerName: 'Test Customer Merge', // Same name, but email matches
                email: testEmail,
                quantity: 1,
                address: initialAddress, // Same primary address
                alternativeAddresses: newAltAddress, // New alt address
                alternativeNames: newAltName, // New alt name
                storeId: store.id
            })
        });

        if (!res2.ok) throw new Error(`Order 2 failed: ${JSON.stringify(await res2.json())}`);
        const order2 = await res2.json();
        console.log(`Order 2 created: ${order2.id}`);

        // 4. Verify Customer has new alternatives
        const customerRes = await fetch(`http://localhost:5000/api/customers/${order1.customerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const customer = await customerRes.json();

        console.log('Customer Data:', JSON.stringify(customer, null, 2));

        const altAddresses = customer.alternativeAddresses || [];
        const altNames = customer.alternativeNames || [];

        if (altAddresses.includes(newAltAddress)) {
            console.log('✅ Alternative Address merged correctly.');
        } else {
            console.error(`❌ Alternative Address NOT found. Expected: ${newAltAddress}`);
        }

        if (altNames.includes(newAltName)) {
            console.log('✅ Alternative Name merged correctly.');
        } else {
            console.error(`❌ Alternative Name NOT found. Expected: ${newAltName}`);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAlternativeMerge();
