require('dotenv').config();
const { User } = require('./db/init').db;

async function checkStoreIds() {
    try {
        const admin = await User.findOne({ where: { email: 'admin@techhub.pk' } });
        const demo = await User.findOne({ where: { email: 'demo@demo.shopifyadmin.pk' } });

        console.log('Admin StoreID:', admin ? admin.storeId : 'NOT FOUND');
        console.log('Demo StoreID:', demo ? demo.storeId : 'NOT FOUND');

        if (admin && demo && admin.storeId === demo.storeId) {
            console.log('CRITICAL: Admin and Demo have SAME StoreID!');
        } else {
            console.log('StoreIDs are distinct.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkStoreIds();
