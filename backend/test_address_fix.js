const { Order, Customer, Store } = require('./db/init').db;
const crypto = require('crypto');

async function testAddressPersistence() {
    try {
        console.log('Starting Address Persistence Test...');

        // 1. Setup: Ensure store exists
        let store = await Store.findOne({ where: { name: 'Test Store' } });
        if (!store) {
            store = await Store.create({
                name: 'Test Store',
                domain: 'test-store.com',
                organizationId: 'test-org'
            });
        }

        const testEmail = `test-addr-${Date.now()}@example.com`;
        const testAddress = '123 Test St, Test City, TS 12345';
        const newAddress = '456 New Ave, New City, NC 67890';

        // 2. Test: Create Order with Address (New Customer)
        // We'll simulate the controller logic or call the controller if we can mock req/res, 
        // but calling controller directly is hard without full mock.
        // Let's replicate the logic we added to verify it works against the DB models.

        // Logic from createOrder:
        // let customer = await findCustomerByContact...
        // if (!customer) create...

        // Let's just use the models directly to verify the relationships and fields work as expected 
        // if we were to run the code.
        // Actually, the best verification is to hit the endpoint if the server is running.
        // The server is running on port 5000 (implied from previous interactions).

        // Let's try to hit the API.
        const token = require('jsonwebtoken').sign({ userId: 'test-admin', role: 'admin', storeId: store.id }, process.env.JWT_SECRET || 'development-secret-please-change');

        console.log('Creating order with new customer and address...');
        const res1 = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                productName: 'Test Product',
                customerName: 'Test Customer Addr',
                email: testEmail,
                quantity: 1,
                address: testAddress,
                storeId: store.id
            })
        });

        const order1 = await res1.json();
        if (!res1.ok) throw new Error(`Order 1 creation failed: ${JSON.stringify(order1)}`);

        console.log(`Order 1 created: ${order1.id}`);

        // Verify Order has shippingAddress
        if (order1.shippingAddress !== testAddress) {
            console.error(`❌ Order 1 shippingAddress mismatch. Expected: ${testAddress}, Got: ${order1.shippingAddress}`);
        } else {
            console.log('✅ Order 1 shippingAddress saved correctly.');
        }

        // Verify Customer has address
        const customer1Res = await fetch(`http://localhost:5000/api/customers/${order1.customerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const customer1 = await customer1Res.json();

        if (customer1.address !== testAddress) {
            console.error(`❌ Customer 1 address mismatch. Expected: ${testAddress}, Got: ${customer1.address}`);
        } else {
            console.log('✅ Customer 1 address saved correctly.');
        }

        // 3. Test: Create Order with NEW Address (Existing Customer)
        console.log('Creating order 2 for SAME customer but NEW address...');
        const res2 = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                productName: 'Test Product 2',
                customerName: 'Test Customer Addr',
                email: testEmail,
                quantity: 1,
                address: newAddress,
                storeId: store.id
            })
        });

        const order2 = await res2.json();
        if (!res2.ok) throw new Error(`Order 2 creation failed: ${JSON.stringify(order2)}`);

        console.log(`Order 2 created: ${order2.id}`);

        // Verify Order 2 has new shippingAddress
        if (order2.shippingAddress !== newAddress) {
            console.error(`❌ Order 2 shippingAddress mismatch. Expected: ${newAddress}, Got: ${order2.shippingAddress}`);
        } else {
            console.log('✅ Order 2 shippingAddress saved correctly.');
        }

        // Verify Customer has new address in alternativeAddresses or updated address
        // Our logic: if address exists, add to alternativeAddresses.
        const customer2Res = await fetch(`http://localhost:5000/api/customers/${order1.customerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const customer2 = await customer2Res.json();

        console.log('Customer 2 Data:', JSON.stringify(customer2, null, 2));

        const altAddresses = customer2.alternativeAddresses || [];
        if (altAddresses.includes(newAddress)) {
            console.log('✅ New address added to alternativeAddresses.');
        } else {
            console.error(`❌ New address NOT found in alternativeAddresses. Found: ${JSON.stringify(altAddresses)}`);
        }

        // 4. Test: Get Order Details (Verify it includes customer address if shippingAddress is missing, or just verify structure)
        const orderDetailRes = await fetch(`http://localhost:5000/api/orders/${order1.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orderDetail = await orderDetailRes.json();

        if (orderDetail.customer && orderDetail.customer.address === testAddress) {
            console.log('✅ Order Details includes Customer data correctly.');
        } else {
            console.error('❌ Order Details missing Customer data or address mismatch.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAddressPersistence();
