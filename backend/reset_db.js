const db = require('./models');

async function resetDatabase() {
    try {
        console.log('Authenticating...');
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');

        console.log('Syncing database (force: true)...');
        await db.sequelize.sync({ force: true });
        console.log('Database synced successfully. All tables dropped and recreated.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to reset database:', error);
        process.exit(1);
    }
}

resetDatabase();
