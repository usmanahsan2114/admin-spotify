const { Discount, Store } = require('./models');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function seedDiscounts() {
    try {
        console.log('Connecting to database...');
        // Ensure DB connection
        const store = await Store.findOne();
        if (!store) {
            console.log('No store found. Cannot seed discounts.');
            process.exit(1);
        }

        console.log(`Seeding discounts for Store: ${store.name} (${store.id})`);

        const discounts = [
            {
                id: crypto.randomUUID(),
                storeId: store.id,
                code: 'SUMMER20',
                type: 'percentage',
                value: 20.00,
                startsAt: new Date(),
                isActive: true
            },
            {
                id: crypto.randomUUID(),
                storeId: store.id,
                code: 'SAVE500',
                type: 'fixed_amount',
                value: 500.00,
                minOrderValue: 1000,
                startsAt: new Date(),
                isActive: true
            },
            {
                id: crypto.randomUUID(),
                storeId: store.id,
                code: 'BOGO',
                type: 'bogo',
                value: 100.00,
                startsAt: new Date(),
                isActive: true
            }
        ];

        for (const d of discounts) {
            const [discount, created] = await Discount.findOrCreate({
                where: { code: d.code, storeId: d.storeId },
                defaults: d
            });
            console.log(`${d.code}: ${created ? 'Created' : 'Already Exists'}`);
        }

        console.log('Discounts seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDiscounts();
