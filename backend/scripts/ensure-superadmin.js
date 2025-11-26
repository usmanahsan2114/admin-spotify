const { User } = require('../db/init').db;
const bcrypt = require('bcryptjs');
const { initializeDatabase } = require('../db/init');

async function ensureSuperAdmin() {
    try {
        await initializeDatabase();

        const email = 'superadmin@shopifyadmin.pk';
        const password = 'superadmin123';

        console.log(`Checking for user: ${email}`);

        let user = await User.findOne({ where: { email } });

        if (user) {
            console.log('Super admin user exists.');
            // Update password just in case it's wrong
            const passwordHash = await bcrypt.hash(password, 10);
            user.passwordHash = passwordHash;
            user.role = 'superadmin';
            user.active = true;
            await user.save();
            console.log('Super admin password and role updated/verified.');
        } else {
            console.log('Super admin user does not exist. Creating...');
            const passwordHash = await bcrypt.hash(password, 10);
            user = await User.create({
                email,
                passwordHash,
                name: 'Super Admin',
                role: 'superadmin',
                active: true,
                permissions: {
                    viewOrders: true, editOrders: true, deleteOrders: true,
                    viewProducts: true, editProducts: true, deleteProducts: true,
                    viewCustomers: true, editCustomers: true,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: true, manageSettings: true,
                }
            });
            console.log('Super admin user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error ensuring super admin:', error);
        process.exit(1);
    }
}

ensureSuperAdmin();
