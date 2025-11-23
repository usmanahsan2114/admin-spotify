
require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./config/database.js')['development'];

console.log('--- Database Configuration ---');
console.log(`Host: ${config.host}`);
console.log(`Dialect: ${config.dialect}`);
console.log(`Database: ${config.database}`);
console.log(`Username: ${config.username}`);

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const [results] = await sequelize.query('SELECT current_database(), inet_server_addr();');
        console.log('Server Info:', results[0]);

        const [users] = await sequelize.query('SELECT email, "storeId" FROM users LIMIT 5;');
        console.log('Sample Users:', users);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
