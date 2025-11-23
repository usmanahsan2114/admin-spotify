require('dotenv').config();
const { db, initializeDatabase } = require('./db/init');

async function fetchCredentials() {
    try {
        await initializeDatabase(); // Ensure DB is initialized
        const stores = await db.Store.findAll({
            order: [['id', 'ASC']],
        });

        const superAdmin = await db.User.findOne({ where: { role: 'superadmin' } });

        console.log('--- CREDENTIALS START ---');

        if (superAdmin) {
            console.log(`Super Admin: ${superAdmin.email}`);
        }

        for (const store of stores) {
            console.log(`Store: ${store.name} (ID: ${store.id})`);
            const admin = await db.User.findOne({ where: { storeId: store.id, role: 'admin' } });
            if (admin) {
                console.log(`  Admin: ${admin.email}`);
            }

            // Fetch a few staff members
            const staff = await db.User.findAll({
                where: { storeId: store.id, role: 'staff' },
                limit: 3
            });

            if (staff.length > 0) {
                console.log(`  Staff Examples: ${staff.map(s => s.email).join(', ')}`);
            }
        }
        console.log('--- CREDENTIALS END ---');
        process.exit(0);
    } catch (error) {
        console.error('Error fetching credentials:', error);
        process.exit(1);
    }
}

fetchCredentials();
