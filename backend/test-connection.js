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

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection established successfully!');
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect:', error);
        process.exit(1);
    }
}

testConnection();
