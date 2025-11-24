const fs = require('fs');
const path = require('path');
const db = require('../models');

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, timestamp);

    console.log(`Starting backup to ${backupPath}...`);

    try {
        fs.mkdirSync(backupPath, { recursive: true });

        // Get all models
        const models = Object.keys(db).filter(
            (key) => key !== 'sequelize' && key !== 'Sequelize'
        );

        for (const modelName of models) {
            console.log(`Backing up ${modelName}...`);
            const Model = db[modelName];

            try {
                const data = await Model.findAll();
                const filePath = path.join(backupPath, `${modelName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`  Saved ${data.length} records to ${modelName}.json`);
            } catch (err) {
                console.error(`  Failed to backup ${modelName}:`, err.message);
            }
        }

        console.log('Backup completed successfully!');

        // Cleanup old backups (keep last 7 days)
        cleanupOldBackups();

    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    } finally {
        await db.sequelize.close();
    }
}

function cleanupOldBackups() {
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(file => fs.statSync(path.join(BACKUP_DIR, file)).isDirectory())
            .sort()
            .reverse(); // Newest first

        const KEEP_COUNT = 7;

        if (backups.length > KEEP_COUNT) {
            const toDelete = backups.slice(KEEP_COUNT);
            console.log(`Cleaning up ${toDelete.length} old backups...`);

            toDelete.forEach(dir => {
                const dirPath = path.join(BACKUP_DIR, dir);
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`  Deleted ${dir}`);
            });
        }
    } catch (err) {
        console.error('Cleanup failed:', err.message);
    }
}

// Run backup
backupDatabase();
