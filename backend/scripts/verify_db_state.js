const fs = require('fs');
const path = require('path');
const { initializeDatabase, db } = require('../db/init');
const { Store, User } = db;

async function verifyState() {
    try {
        // Suppress console.log from sequelize if possible, but we can't easily.
        // We will write our output to a file.
        await initializeDatabase();

        let output = '';
        const log = (msg) => { output += msg + '\n'; };

        const stores = await Store.findAll({
            include: [{
                model: User,
                as: 'users',
                attributes: ['id', 'email', 'role', 'name']
            }]
        });

        log('--- STORES & USERS ---');
        stores.forEach(store => {
            log(`\nStore: ${store.name} (ID: ${store.id})`);
            log(`Domain: ${store.domain || 'N/A'}`);
            if (store.users && store.users.length > 0) {
                log('  Users:');
                store.users.forEach(user => {
                    log(`    - ${user.name} (${user.email}) [${user.role}]`);
                });
            } else {
                log('  No users found.');
            }
        });

        const superAdmins = await User.findAll({
            where: { role: 'superadmin' }
        });

        log('\n--- SUPERADMINS ---');
        if (superAdmins.length > 0) {
            superAdmins.forEach(admin => {
                log(`- ${admin.name} (${admin.email})`);
            });
        } else {
            log('No superadmin found.');
        }

        const usersWithoutStore = await User.findAll({
            where: { storeId: null, role: ['admin', 'staff'] }
        });

        if (usersWithoutStore.length > 0) {
            log('\n--- ORPHANED USERS (No Store) ---');
            usersWithoutStore.forEach(user => {
                log(`- ${user.name} (${user.email}) [${user.role}]`);
            });
        }

        fs.writeFileSync(path.join(__dirname, 'verification_output.txt'), output);
        console.log('Verification output written to verification_output.txt');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        process.exit();
    }
}

verifyState();
