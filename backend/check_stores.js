/**
 * Check and configure stores for track-order page
 * Run with: node -r dotenv/config check_stores.js
 */
require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

async function checkStores() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database!\n');

        // List all stores
        console.log('📦 STORES:');
        console.log('─'.repeat(60));
        const stores = await client.query('SELECT id, name, "dashboardName", "isDemo", domain FROM stores');
        for (const store of stores.rows) {
            console.log(`  ${store.name}`);
            console.log(`    ID: ${store.id}`);
            console.log(`    Dashboard: ${store.dashboardName || 'N/A'}`);
            console.log(`    Demo: ${store.isDemo ? 'Yes' : 'No'}`);
            console.log('');
        }

        // Check orders per store
        console.log('\n📋 ORDERS PER STORE:');
        console.log('─'.repeat(60));
        const orderCounts = await client.query(`
            SELECT s.name, s.id, COUNT(o.id) as order_count 
            FROM stores s 
            LEFT JOIN orders o ON s.id = o."storeId" 
            GROUP BY s.id, s.name
        `);
        for (const row of orderCounts.rows) {
            console.log(`  ${row.name}: ${row.order_count} orders`);
        }

        // Find test user's store
        console.log('\n🔍 TEST USER STORE:');
        console.log('─'.repeat(60));
        const testUser = await client.query(`
            SELECT u.email, u."storeId", s.name as "storeName", s.id
            FROM users u 
            JOIN stores s ON u."storeId" = s.id 
            WHERE u.email = 'testuser@localhost.dev'
        `);

        if (testUser.rows.length > 0) {
            const store = testUser.rows[0];
            console.log(`  User: ${store.email}`);
            console.log(`  Store: ${store.storeName} (${store.storeId})`);

            // Get order count for this store
            const orders = await client.query(
                'SELECT COUNT(*) FROM orders WHERE "storeId" = $1',
                [store.storeId]
            );
            console.log(`  Orders: ${orders.rows[0].count}`);
        } else {
            console.log('  ❌ Test user not found!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkStores();
