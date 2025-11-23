require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('./db/init');

async function resetPasswords() {
    try {
        await initializeDatabase();

        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        const staffPasswordHash = await bcrypt.hash('staff123', 10);

        const admin = await db.User.findOne({ where: { email: 'admin@pakgusu.pk' } });
        if (admin) {
            await admin.update({ passwordHash: adminPasswordHash, active: true });
            console.log('Reset password for admin@pakgusu.pk');
        } else {
            console.log('Admin not found');
        }

        const staff = await db.User.findOne({ where: { email: 'staff@pakgusu.pk' } });
        if (staff) {
            await staff.update({ passwordHash: staffPasswordHash, active: true });
            console.log('Reset password for staff@pakgusu.pk');
        } else {
            console.log('Staff not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error resetting passwords:', error);
        process.exit(1);
    }
}

resetPasswords();
