require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const { Client } = require('pg');

let { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
let DB_SSL = process.env.DB_SSL === 'true';

if (process.env.DATABASE_URL) {
    console.log('Parsing DATABASE_URL...');
    try {
        const url = new URL(process.env.DATABASE_URL);
        DB_HOST = url.hostname;
        DB_PORT = url.port || 5432;
        DB_USER = url.username;
        DB_PASSWORD = url.password;
        DB_NAME = url.pathname.replace('/', '');
        if (url.searchParams.get('sslmode') === 'require') {
            DB_SSL = true;
        }
        console.log(`Parsed Config:`);
        console.log(`  Host: ${DB_HOST}`);
        console.log(`  User: ${DB_USER}`);
        console.log(`  DB: ${DB_NAME}`);
        console.log(`  Port: ${DB_PORT}`);
        console.log(`  SSL: ${DB_SSL}`);
        console.log(`  Password Length: ${DB_PASSWORD ? DB_PASSWORD.length : 0}`);
    } catch (e) {
        console.error('Failed to parse DATABASE_URL:', e.message);
    }
}

console.log('--- Production Database Verification Script ---');
console.log(`Target Host: ${DB_HOST}`);

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error('ERROR: Missing required environment variables.');
    process.exit(1);
}

async function verifyConnection() {
    console.log('\n--- 1. Testing Raw PG Client ---');
    const client = new Client({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: DB_PORT,
        ssl: DB_SSL ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('✅ Raw PG Connection Successful!');
        const res = await client.query('SELECT NOW()');
        console.log('   Server Time:', res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error('❌ Raw PG Connection (Pooler) Failed:', err.message);

        // Retry with aws-0 if aws-1 failed (and vice versa)
        if (DB_HOST.includes('aws-1')) {
            const altHost = DB_HOST.replace('aws-1', 'aws-0');
            console.log(`\n--- 1b. Testing Alternate Pooler (${altHost}) ---`);
            const altClient = new Client({
                host: altHost,
                user: DB_USER,
                password: DB_PASSWORD,
                database: DB_NAME,
                port: 6543,
                ssl: { rejectUnauthorized: false }
            });
            try {
                await altClient.connect();
                console.log('✅ Alternate Pooler Connection Successful!');
                await altClient.end();
                return;
            } catch (e) {
                console.error('❌ Alternate Pooler Failed:', e.message);
            }
        }

        // Try Direct Connection (bypass pooler) to diagnose if it's just the Pooler Host/Region that's wrong
        if (DB_USER.includes('.')) {
            const projectRef = DB_USER.split('.')[1];
            // Supabase connection string format is usually aws-0-[region].pooler.supabase.com
            // But direct connection is db.[project-ref].supabase.co
            const directHost = `db.${projectRef}.supabase.co`;
            console.log(`\n--- 1c. Testing Direct Connection (${directHost}) ---`);

            // Allow some retries for DNS
            for (let i = 0; i < 3; i++) {
                try {
                    const directClient = new Client({
                        host: directHost,
                        user: 'postgres',
                        password: DB_PASSWORD,
                        database: DB_NAME,
                        port: 5432,
                        ssl: { rejectUnauthorized: false }
                    });

                    if (i > 0) console.log(`   Retry ${i + 1}...`);

                    await directClient.connect();
                    console.log('✅ Direct Connection Successful!');
                    console.log('   (This means your Password is correct, but your Pooler Host/Region is likely wrong.)');
                    const res = await directClient.query('SELECT NOW()');
                    console.log('   Server Time:', res.rows[0].now);
                    await directClient.end();
                    return;
                } catch (directErr) {
                    if (directErr.code === 'ENOTFOUND') {
                        console.log(`   DNS Lookup failed for ${directHost}. Waiting...`);
                        await new Promise(r => setTimeout(r, 2000));
                        continue;
                    }
                    console.error('❌ Direct Connection Failed:', directErr.message);
                    return;
                }
            }
            console.error('❌ Direct Connection Failed: DNS ENOTFOUND after 3 attempts.');
        }
        return;
    }

    console.log('\n--- 2. Testing Sequelize (Skipping if raw failed) ---');
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: DB_SSL ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    });

    try {
        console.log('\n1. Testing Connection...');
        await sequelize.authenticate();
        console.log('✅ Connection Successful!');

        console.log('\n2. Checking Tables...');
        const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = results.map(r => r.table_name);
        console.log('Found tables:', tables.join(', '));

        if (tables.includes('customers')) {
            console.log('\n3. Checking "customers" table schema for JSONB columns...');
            const [columns] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers'");

            const jsonbColumns = columns.filter(c => c.data_type === 'jsonb').map(c => c.column_name);
            console.log('JSONB Columns found:', jsonbColumns.length > 0 ? jsonbColumns.join(', ') : 'NONE');

            const expectedJsonb = ['alternativeNames', 'alternativeEmails', 'alternativePhones', 'alternativeAddresses'];
            const missing = expectedJsonb.filter(col => !jsonbColumns.includes(col));

            if (missing.length === 0) {
                console.log('✅ All expected columns are correctly set to JSONB.');
            } else {
                console.error('❌ Mismatch! The following columns are NOT JSONB (or missing):', missing.join(', '));
                console.log('   Please run migrations: npx sequelize-cli db:migrate --env production');
            }
        } else {
            console.error('❌ "customers" table not found!');
        }

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

verifyConnection();
