const { Product, Category, Store } = require('./models');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function seedSEO() {
    try {
        console.log('Connecting to database...');
        const store = await Store.findOne();
        if (!store) {
            console.log('No store found.');
            process.exit(1);
        }

        console.log(`Seeding SEO for Store: ${store.name}`);

        // 1. Update a Product with SEO
        const product = await Product.findOne({ where: { storeId: store.id } });
        if (product) {
            await product.update({
                slug: 'test-product-seo',
                metaTitle: 'Best Product Ever - Buy Now',
                metaDescription: 'This is the best product you can buy. High quality.'
            });
            console.log('Updated Product SEO:', product.name);
        }

        // 2. Create a Category with SEO
        const [cat, created] = await Category.findOrCreate({
            where: { slug: 'summer-collection', storeId: store.id },
            defaults: {
                id: crypto.randomUUID(),
                storeId: store.id,
                name: 'Summer Collection',
                slug: 'summer-collection',
                description: 'Hot items for summer.',
                metaTitle: 'Summer Collection 2025',
                metaDescription: 'Shop our latest summer styles.'
            }
        });
        console.log(`Category ${cat.name}: ${created ? 'Created' : 'Exists'}`);

        console.log('SEO Seeded!');
        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
}

seedSEO();
