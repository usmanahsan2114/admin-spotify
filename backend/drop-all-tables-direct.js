require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { Client } = require('pg')

async function dropAllTables() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    })

    try {
        await client.connect()
        console.log('✅ Connected to database')

        // Drop all tables
        console.log('\nDropping all tables...\n')

        const dropTablesSQL = `
      DO $$ 
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
              RAISE NOTICE 'Dropped table: %', r.tablename;
          END LOOP;
      END $$;
    `

        await client.query(dropTablesSQL)
        console.log('✅ All tables dropped successfully')

        // List remaining tables
        const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `)

        console.log(`\n Tables remaining: ${result.rows.length}`)
        if (result.rows.length > 0) {
            result.rows.forEach(row => console.log(`  - ${row.tablename}`))
        } else {
            console.log('  (none - database is clean)')
        }

        await client.end()
        console.log('\n✅ Database cleaned successfully')
        process.exit(0)
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

dropAllTables()
