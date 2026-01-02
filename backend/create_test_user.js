/**
 * Create a test user in the production database
 * Run with: node -r dotenv/config create_test_user.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

const TEST_USER = {
    id: crypto.randomUUID(),
    email: 'testuser@localhost.dev',
    password: 'test1234',
    name: 'Test User',
    role: 'admin',
    fullName: 'Test User (Local Dev)',
    phone: '+92-300-1234567',
};

async function createTestUser() {
    console.log('Connecting to database...');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected!');

        // Check if user already exists
        const existingUser = await client.query(
            'SELECT id, email FROM users WHERE email = $1',
            [TEST_USER.email]
        );

        if (existingUser.rows.length > 0) {
            console.log(`User ${TEST_USER.email} already exists (ID: ${existingUser.rows[0].id})`);
            console.log('\n✅ Login Credentials:');
            console.log(`   Email: ${TEST_USER.email}`);
            console.log(`   Password: ${TEST_USER.password}`);
            return;
        }

        // Get first store ID for the test user
        const storeResult = await client.query('SELECT id, name FROM stores LIMIT 1');
        if (storeResult.rows.length === 0) {
            console.error('No stores found in database. Cannot create test user.');
            process.exit(1);
        }
        const storeId = storeResult.rows[0].id;
        console.log(`Assigning to store: ${storeResult.rows[0].name} (${storeId})`);

        // Hash password
        const passwordHash = bcrypt.hashSync(TEST_USER.password, 10);

        // Create user
        await client.query(
            `INSERT INTO users (id, email, "passwordHash", name, role, "storeId", "fullName", phone, active, "passwordChangedAt", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW(), NOW())`,
            [TEST_USER.id, TEST_USER.email, passwordHash, TEST_USER.name, TEST_USER.role, storeId, TEST_USER.fullName, TEST_USER.phone]
        );

        console.log('\n✅ Test User Created Successfully!');
        console.log('─'.repeat(40));
        console.log(`   Email:    ${TEST_USER.email}`);
        console.log(`   Password: ${TEST_USER.password}`);
        console.log(`   Role:     ${TEST_USER.role}`);
        console.log(`   Store:    ${storeResult.rows[0].name}`);
        console.log('─'.repeat(40));
        console.log('\nYou can now login at: http://localhost:5173/login (or :5175 if 5173 is busy)');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

createTestUser();
