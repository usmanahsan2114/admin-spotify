require('dotenv').config();
const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const tables = ['stores', 'users', 'customers', 'products', 'orders', 'returns'];

    for (const table of tables) {
        console.log(`\n=== ${table.toUpperCase()} ===`);
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
        `, [table]);

        for (const col of result.rows) {
            console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : ''}`);
        }
    }

    await client.end();
}
checkSchema().catch(console.error);
