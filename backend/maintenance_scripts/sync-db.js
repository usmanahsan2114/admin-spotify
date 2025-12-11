const db = require('./models');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function syncDatabase() {
    try {
        console.log('Syncing database...');
        await db.sequelize.authenticate();
        console.log('Connection established.');

        // Force sync to create tables
        await db.sequelize.sync({ alter: true });
        console.log('Database synced successfully (alter: true).');

        process.exit(0);
    } catch (error) {
        console.error('Sync error:', error);
        process.exit(1);
    }
}

syncDatabase();
