require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');

async function testInsert() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('Connected!');

    // Get test user store
    const user = await client.query("SELECT \"storeId\" FROM users WHERE email = 'testuser@localhost.dev'");
    const storeId = user.rows[0].storeId;
    console.log('StoreId:', storeId);

    // Get a customer
    const customer = await client.query('SELECT id, name, email, phone, address FROM customers WHERE "storeId" = $1 LIMIT 1', [storeId]);
    console.log('Customer:', customer.rows[0]);

    if (customer.rows.length === 0) {
        console.log('No customers found');
        await client.end();
        return;
    }

    const c = customer.rows[0];

    // Try inserting one order
    const orderId = crypto.randomUUID();
    const orderNumber = 'TEST-' + Date.now();

    try {
        console.log('\nAttempting insert...');
        await client.query(
            `INSERT INTO orders (id, "storeId", "customerId", "orderNumber", "productName", "customerName", email, phone, quantity, status, "isPaid", total, "submittedBy", timeline, items, "shippingAddress", "paymentStatus", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17, NOW(), NOW())`,
            [orderId, storeId, c.id, orderNumber, 'Test Product', c.name, c.email, c.phone, 1, 'Pending', false, 1000, null, JSON.stringify([]), JSON.stringify([]), JSON.stringify({ address: c.address }), 'pending']
        );
        console.log('✅ Order inserted successfully!');

        // Verify
        const check = await client.query('SELECT COUNT(*) FROM orders WHERE "storeId" = $1', [storeId]);
        console.log('Orders in store now:', check.rows[0].count);
    } catch (error) {
        console.error('❌ Insert failed:', error.message);
        console.error('Full error:', error);
    }

    await client.end();
}

testInsert().catch(console.error);
