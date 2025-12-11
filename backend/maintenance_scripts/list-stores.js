
const { Store, User } = require('./models');

async function listStoresAndAdmins() {
    try {
        const stores = await Store.findAll();
        console.log('--- Stores ---');
        for (const store of stores) {
            console.log(`Store: ${store.name} (${store.domain})`);
            const admins = await User.findAll({ where: { storeId: store.id, role: 'admin' } });
            for (const admin of admins) {
                console.log(`  Admin: ${admin.email}`);
            }
        }

        console.log('--- Superadmins ---');
        const superadmins = await User.findAll({ where: { role: 'superadmin' } });
        for (const sa of superadmins) {
            console.log(`  Superadmin: ${sa.email}`);
        }

    } catch (error) {
        console.error('Error listing stores:', error);
    }
}

listStoresAndAdmins();
