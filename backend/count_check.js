require('dotenv').config();
const { Client } = require('pg');

async function count() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const user = await client.query("SELECT \"storeId\" FROM users WHERE email = 'testuser@localhost.dev'");
    const storeId = user.rows[0].storeId;

    const orders = await client.query('SELECT COUNT(*) as c FROM orders WHERE "storeId" = $1', [storeId]);
    const customers = await client.query('SELECT COUNT(*) as c FROM customers WHERE "storeId" = $1', [storeId]);
    const products = await client.query('SELECT COUNT(*) as c FROM products WHERE "storeId" = $1', [storeId]);
    const returns = await client.query('SELECT COUNT(*) as c FROM returns WHERE "storeId" = $1', [storeId]);

    console.log('=== DATA COUNTS ===');
    console.log('Orders:', orders.rows[0].c);
    console.log('Customers:', customers.rows[0].c);
    console.log('Products:', products.rows[0].c);
    console.log('Returns:', returns.rows[0].c);

    await client.end();
}
count().catch(console.error);
