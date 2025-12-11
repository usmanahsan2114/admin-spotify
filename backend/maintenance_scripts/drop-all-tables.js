require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: 'aws-1-ap-southeast-2.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    username: 'postgres.vtvcibfzltckofcwrzuv',
    password: '4acTMRbpjXTcHErW',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: console.log
});

async function dropAllTables() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Drop tables in correct order (to handle foreign keys)
        const tables = [
            'returns',
            'orders',
            'customers',
            'products',
            'settings',
            'users',
            'stores',
            'SequelizeMeta'
        ];

        for (const table of tables) {
            try {
                await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
                console.log(`✅ Dropped table: ${table}`);
            } catch (error) {
                console.log(`⚠️  Could not drop ${table}: ${error.message}`);
            }
        }

        console.log('\n✅ All tables dropped successfully!');
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

dropAllTables();
