require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { Client } = require('pg')

// Test both transaction pooler (6543) and session pooler (5432)
const configs = [
    {
        name: 'Transaction Pooler',
        port: 6543,
    },
    {
        name: 'Session Pooler',
        port: 5432,
    }
]

async function testConnection(config) {
    console.log(`\n=== Testing ${config.name} (Port ${config.port}) ===\n`)

    const connectionString = `postgresql://postgres.yqzwfbufcmxzeqfbdlpf:${encodeURIComponent('7!tR/HubhpWc!SF')}@aws-1-ap-northeast-2.pooler.supabase.com:${config.port}/postgres`

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    })

    try {
        await client.connect()
        console.log('✅ Connection successful!')

        const versionResult = await client.query('SELECT version();')
        console.log('PostgreSQL version:', versionResult.rows[0].version.substring(0, 50) + '...')

        const userResult = await client.query('SELECT current_user, current_database();')
        console.log('Current user:', userResult.rows[0].current_user)
        console.log('Current database:', userResult.rows[0].current_database)

        await client.end()
        console.log(`✅ ${config.name} test completed successfully`)
        return true
    } catch (err) {
        console.error(`❌ ${config.name} failed:`, err.message)
        return false
    }
}

async function runTests() {
    console.log('\n======================================')
    console.log('Supabase Connection Test')
    console.log('======================================')
    console.log('Host: aws-1-ap-northeast-2.pooler.supabase.com')
    console.log('User: postgres.yqzwfbufcmxzeqfbdlpf')
    console.log('Database: postgres')
    console.log('======================================\n')

    for (const config of configs) {
        const success = await testConnection(config)
        if (success) {
            console.log(`\n✅ Recommended: Use ${config.name} on port ${config.port}`)
            process.exit(0)
        }
    }

    console.log('\n❌ All connection tests failed')
    console.log('\nPlease verify:')
    console.log('1. Database password is correct')
    console.log('2. Supabase project is active')
    console.log('3. Database pooling is enabled in Supabase')
    process.exit(1)
}

runTests()
