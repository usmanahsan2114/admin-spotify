const { Page, BlogPost, Store } = require('./models');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function seedCMS() {
    try {
        console.log('Connecting to database...');
        const store = await Store.findOne();
        if (!store) {
            console.log('No store found. Cannot seed CMS.');
            process.exit(1);
        }

        console.log(`Seeding CMS for Store: ${store.name} (${store.id})`);

        // 1. Pages
        const pages = [
            {
                id: crypto.randomUUID(),
                storeId: store.id,
                title: 'About Us',
                slug: 'about-us',
                content: '<h1>About Us</h1><p>We are the best store in the world.</p>',
                isPublished: true,
                metaTitle: 'About Us - My Store',
                metaDescription: 'Learn more about our story.'
            },
            {
                id: crypto.randomUUID(),
                storeId: store.id,
                title: 'FAQ',
                slug: 'faq',
                content: '<h1>Frequently Asked Questions</h1><p>Q: Do you ship?</p><p>A: Yes.</p>',
                isPublished: true,
                metaTitle: 'FAQ - My Store',
                metaDescription: 'Common questions answered.'
            }
        ];

        for (const p of pages) {
            const [page, created] = await Page.findOrCreate({
                where: { slug: p.slug, storeId: p.storeId },
                defaults: p
            });
            console.log(`Page ${p.slug}: ${created ? 'Created' : 'Already Exists'}`);
        }

        // 2. Blog Posts
        const posts = [
            {
                id: crypto.randomUUID(),
                storeId: store.id,
                title: 'Welcome to our new store!',
                slug: 'welcome',
                content: '<p>We are excited to launch our new website.</p>',
                excerpt: 'Exciting news!',
                author: 'Admin',
                isPublished: true,
                publishedAt: new Date(),
                tags: 'news,launch'
            }
        ];

        for (const p of posts) {
            const [post, created] = await BlogPost.findOrCreate({
                where: { slug: p.slug, storeId: p.storeId },
                defaults: p
            });
            console.log(`Post ${p.slug}: ${created ? 'Created' : 'Already Exists'}`);
        }

        console.log('CMS seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedCMS();
