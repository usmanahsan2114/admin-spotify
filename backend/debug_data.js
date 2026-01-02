require('dotenv').config();
const { Client } = require('pg');

async function debug() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const user = await client.query("SELECT \"storeId\" FROM users WHERE email = 'testuser@localhost.dev'");
    if (user.rows.length === 0) {
        console.log('User not found');
        await client.end();
        return;
    }

    const storeId = user.rows[0].storeId;
    console.log('Test User StoreId:', storeId);

    const orders = await client.query('SELECT COUNT(*) FROM orders WHERE "storeId" = $1', [storeId]);
    const customers = await client.query('SELECT COUNT(*) FROM customers WHERE "storeId" = $1', [storeId]);
    const products = await client.query('SELECT COUNT(*) FROM products WHERE "storeId" = $1', [storeId]);
    const returns = await client.query('SELECT COUNT(*) FROM returns WHERE "storeId" = $1', [storeId]);

    console.log('Orders:', orders.rows[0].count);
    console.log('Customers:', customers.rows[0].count);
    console.log('Products:', products.rows[0].count);
    console.log('Returns:', returns.rows[0].count);

    // Sample order
    const sampleOrder = await client.query('SELECT id, "orderNumber", "customerName", status FROM orders WHERE "storeId" = $1 LIMIT 3', [storeId]);
    console.log('Sample Orders:', sampleOrder.rows);

    await client.end();
}
debug().catch(console.error);
