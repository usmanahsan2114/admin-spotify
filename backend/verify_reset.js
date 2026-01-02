require('dotenv').config();
const { Client } = require('pg');

async function verify() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('=== DATABASE VERIFICATION ===\n');

    // Count stores
    const stores = await client.query('SELECT id, name, "defaultCurrency" as currency FROM stores');
    console.log('STORES:');
    for (const s of stores.rows) {
        console.log(`  • ${s.name} (${s.currency})`);
    }

    // Count users
    const users = await client.query('SELECT email, role, "storeId" FROM users');
    console.log('\nUSERS:');
    for (const u of users.rows) {
        console.log(`  • ${u.email} [${u.role}]`);
    }

    // Count data per store
    console.log('\nDATA PER STORE:');
    for (const s of stores.rows) {
        const orders = await client.query('SELECT COUNT(*) FROM orders WHERE "storeId" = $1', [s.id]);
        const customers = await client.query('SELECT COUNT(*) FROM customers WHERE "storeId" = $1', [s.id]);
        const products = await client.query('SELECT COUNT(*) FROM products WHERE "storeId" = $1', [s.id]);
        const returns = await client.query('SELECT COUNT(*) FROM returns WHERE "storeId" = $1', [s.id]);

        console.log(`\n  ${s.name}:`);
        console.log(`    Orders: ${orders.rows[0].count}`);
        console.log(`    Customers: ${customers.rows[0].count}`);
        console.log(`    Products: ${products.rows[0].count}`);
        console.log(`    Returns: ${returns.rows[0].count}`);
    }

    await client.end();
}
verify().catch(console.error);
