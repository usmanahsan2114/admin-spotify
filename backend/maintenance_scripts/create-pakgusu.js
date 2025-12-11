
const { Store, User } = require('./models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createPakGusuStore() {
    try {
        // 1. Check if store exists
        let store = await Store.findOne({ where: { domain: 'pakgusu.pk' } });

        if (!store) {
            console.log('Creating Pak Gusu Store...');
            store = await Store.create({
                id: uuidv4(),
                name: 'Pak Gusu Store',
                dashboardName: 'Pak Gusu',
                domain: 'pakgusu.pk',
                category: 'General',
                country: 'PK',
                defaultCurrency: 'PKR',
                brandColor: '#1db954', // Spotify green-ish
                isDemo: false
            });
            console.log('Store created:', store.toJSON());
        } else {
            console.log('Store already exists:', store.toJSON());
        }

        // 2. Check if user exists
        const email = 'admin@pakgusu.pk';
        let user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('Creating admin user...');
            const passwordHash = await bcrypt.hash('admin123', 10);

            user = await User.create({
                id: uuidv4(),
                email,
                passwordHash,
                name: 'Pak Gusu Admin',
                role: 'admin',
                storeId: store.id,
                fullName: 'Pak Gusu Admin',
                active: true
            });
            console.log('User created:', user.toJSON());
        } else {
            console.log('User already exists:', user.toJSON());
            // Reset password just in case
            const passwordHash = await bcrypt.hash('admin123', 10);
            await user.update({ passwordHash });
            console.log('Password reset to admin123');
        }

    } catch (error) {
        console.error('Error creating store/user:', error);
    }
}

createPakGusuStore();
