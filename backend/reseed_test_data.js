/**
 * Clear and reseed test data for testuser@localhost.dev
 * Run with: node -r dotenv/config reseed_test_data.js
 */
require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

// Pakistan cities and areas for realistic data
const PAKISTAN_CITIES = [
    { city: 'Karachi', areas: ['DHA', 'Clifton', 'Gulshan-e-Iqbal', 'PECHS', 'Saddar', 'North Nazimabad', 'Korangi'] },
    { city: 'Lahore', areas: ['DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Bahria Town', 'Cantt', 'Faisal Town'] },
    { city: 'Islamabad', areas: ['F-6', 'F-7', 'F-8', 'G-9', 'G-10', 'E-11', 'I-8', 'Bahria Town'] },
    { city: 'Rawalpindi', areas: ['Saddar', 'Commercial Market', 'Westridge', 'Chaklala', 'Bahria Town'] },
    { city: 'Faisalabad', areas: ['D Ground', 'Peoples Colony', 'Madina Town', 'Jinnah Colony'] },
    { city: 'Multan', areas: ['Bosan Road', 'Cantt', 'Shah Rukn-e-Alam', 'Gulgasht Colony'] },
    { city: 'Peshawar', areas: ['Hayatabad', 'University Town', 'Saddar', 'Cantt'] },
];

const PAKISTANI_FIRST_NAMES = ['Ahmed', 'Ali', 'Hassan', 'Usman', 'Bilal', 'Imran', 'Kashif', 'Zain', 'Faisal', 'Arslan',
    'Ayesha', 'Fatima', 'Sana', 'Hira', 'Zainab', 'Maryam', 'Amna', 'Rabia', 'Nadia', 'Sara'];
const PAKISTANI_LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Malik', 'Hussain', 'Shah', 'Raza', 'Butt', 'Iqbal', 'Rehman',
    'Qureshi', 'Chaudhry', 'Siddiqui', 'Sheikh', 'Aslam', 'Farooq', 'Javed', 'Haider', 'Noor', 'Anwar'];

const ELECTRONICS_PRODUCTS = [
    { name: 'Samsung Galaxy S24 Ultra', price: 349999, category: 'Smartphones' },
    { name: 'iPhone 15 Pro Max', price: 449999, category: 'Smartphones' },
    { name: 'OnePlus 12', price: 174999, category: 'Smartphones' },
    { name: 'Xiaomi 14 Pro', price: 134999, category: 'Smartphones' },
    { name: 'Sony WH-1000XM5 Headphones', price: 89999, category: 'Audio' },
    { name: 'Apple AirPods Pro 2', price: 74999, category: 'Audio' },
    { name: 'JBL Flip 6 Speaker', price: 24999, category: 'Audio' },
    { name: 'MacBook Pro 16" M3', price: 799999, category: 'Laptops' },
    { name: 'Dell XPS 15', price: 449999, category: 'Laptops' },
    { name: 'HP Spectre x360', price: 349999, category: 'Laptops' },
    { name: 'Lenovo ThinkPad X1 Carbon', price: 389999, category: 'Laptops' },
    { name: 'Apple iPad Pro 12.9"', price: 329999, category: 'Tablets' },
    { name: 'Samsung Galaxy Tab S9', price: 219999, category: 'Tablets' },
    { name: 'Apple Watch Series 9', price: 124999, category: 'Wearables' },
    { name: 'Samsung Galaxy Watch 6', price: 74999, category: 'Wearables' },
    { name: 'Anker PowerCore 26800', price: 12999, category: 'Accessories' },
    { name: 'Logitech MX Master 3S', price: 29999, category: 'Accessories' },
    { name: 'Keychron K2 Mechanical Keyboard', price: 24999, category: 'Accessories' },
    { name: 'Samsung 55" QLED TV', price: 289999, category: 'TVs' },
    { name: 'LG C3 65" OLED TV', price: 449999, category: 'TVs' },
    { name: 'Sony PlayStation 5', price: 164999, category: 'Gaming' },
    { name: 'Xbox Series X', price: 154999, category: 'Gaming' },
    { name: 'Nintendo Switch OLED', price: 89999, category: 'Gaming' },
    { name: 'Razer DeathAdder V3', price: 19999, category: 'Gaming' },
    { name: 'Canon EOS R6 Mark II', price: 649999, category: 'Cameras' },
];

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generatePhone() {
    const prefixes = ['300', '301', '302', '303', '304', '305', '306', '307', '321', '322', '323', '333', '334', '335'];
    return `+92-${randomChoice(prefixes)}-${randomInt(1000000, 9999999)}`;
}
function generateAddress() {
    const cityData = randomChoice(PAKISTAN_CITIES);
    return `House ${randomInt(1, 500)}, Street ${randomInt(1, 50)}, ${randomChoice(cityData.areas)}, ${cityData.city}, Pakistan`;
}

async function reseedTestData() {
    console.log('🔄 RESEED: Clearing and seeding test data for testuser@localhost.dev...\n');

    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log('Connected to database!');

        // Find test user and their store
        const userResult = await client.query(
            'SELECT u.id, u."storeId", s.name as "storeName" FROM users u JOIN stores s ON u."storeId" = s.id WHERE u.email = $1',
            ['testuser@localhost.dev']
        );

        if (userResult.rows.length === 0) {
            console.error('❌ Test user not found. Run create_test_user.js first.');
            process.exit(1);
        }

        const storeId = userResult.rows[0].storeId;
        const storeName = userResult.rows[0].storeName;
        console.log(`Found test user's store: ${storeName} (${storeId})`);

        // DELETE EXISTING DATA for this store only
        console.log('\n🗑️  Clearing existing data for this store...');
        await client.query('DELETE FROM returns WHERE "storeId" = $1', [storeId]);
        await client.query('DELETE FROM orders WHERE "storeId" = $1', [storeId]);
        await client.query('DELETE FROM customers WHERE "storeId" = $1', [storeId]);
        await client.query('DELETE FROM products WHERE "storeId" = $1', [storeId]);
        console.log('   ✅ Existing data cleared');

        // Generate customers (30)
        console.log('\n👥 Generating 30 Pakistan customers...');
        const customers = [];
        for (let i = 0; i < 30; i++) {
            const firstName = randomChoice(PAKISTANI_FIRST_NAMES);
            const lastName = randomChoice(PAKISTANI_LAST_NAMES);
            customers.push({
                id: crypto.randomUUID(), storeId, name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@gmail.com`,
                phone: generatePhone(), address: generateAddress(),
            });
        }
        for (const c of customers) {
            await client.query(
                `INSERT INTO customers (id, "storeId", name, email, phone, address, "alternativeNames", "alternativeEmails", "alternativePhones", "alternativeAddresses", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, '[]', '[]', '[]', '[]', NOW(), NOW())`,
                [c.id, c.storeId, c.name, c.email, c.phone, c.address]
            );
        }
        console.log(`   ✅ Created ${customers.length} customers`);

        // Generate products (25)
        console.log('\n📱 Generating 25 electronics products...');
        const products = [];
        for (const p of ELECTRONICS_PRODUCTS) {
            products.push({
                id: crypto.randomUUID(), storeId, name: p.name, price: p.price, category: p.category,
                description: `High-quality ${p.name} available at the best price in Pakistan.`,
                stockQuantity: randomInt(5, 100), reorderThreshold: 10, status: 'active',
            });
        }
        for (const p of products) {
            await client.query(
                `INSERT INTO products (id, "storeId", name, description, price, "stockQuantity", "reorderThreshold", category, status, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                [p.id, p.storeId, p.name, p.description, p.price, p.stockQuantity, p.reorderThreshold, p.category, p.status]
            );
        }
        console.log(`   ✅ Created ${products.length} products`);

        // Generate orders (75)
        console.log('\n📋 Generating 75 orders...');
        const orders = [];
        for (let i = 0; i < 75; i++) {
            const customer = randomChoice(customers);
            const product = randomChoice(products);
            const quantity = randomInt(1, 3);
            const statuses = ['Pending', 'Accepted', 'Shipped', 'Completed'];
            const status = randomChoice(statuses);
            const isPaid = ['Paid', 'Accepted', 'Shipped', 'Completed'].includes(status);
            const daysAgo = randomInt(0, 180);
            const orderDate = new Date(); orderDate.setDate(orderDate.getDate() - daysAgo);

            orders.push({
                id: crypto.randomUUID(), storeId, customerId: customer.id,
                orderNumber: `ORD-${String(i + 1).padStart(5, '0')}`,
                productName: product.name, customerName: customer.name,
                email: customer.email, phone: customer.phone, quantity, status, isPaid,
                total: product.price * quantity, submittedBy: null,
                timeline: JSON.stringify([{ status, date: orderDate.toISOString(), note: 'Order created' }]),
                items: JSON.stringify([{ productId: product.id, name: product.name, price: product.price, quantity }]),
                shippingAddress: customer.address, paymentStatus: isPaid ? 'paid' : 'pending',
                createdAt: orderDate, updatedAt: orderDate,
            });
        }
        for (const o of orders) {
            await client.query(
                `INSERT INTO orders (id, "storeId", "customerId", "orderNumber", "productName", "customerName", email, phone, quantity, status, "isPaid", total, "submittedBy", timeline, items, "shippingAddress", "paymentStatus", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18, $19)`,
                [o.id, o.storeId, o.customerId, o.orderNumber, o.productName, o.customerName, o.email, o.phone, o.quantity, o.status, o.isPaid, o.total, o.submittedBy, o.timeline, o.items, JSON.stringify({ address: o.shippingAddress }), o.paymentStatus, o.createdAt, o.updatedAt]
            );
        }
        console.log(`   ✅ Created ${orders.length} orders`);

        // Generate returns (10)
        console.log('\n🔄 Generating 10 return requests...');
        const completedOrders = orders.filter(o => ['Shipped', 'Completed'].includes(o.status)).slice(0, 10);
        const returnReasons = ['Defective product', 'Wrong item received', 'Changed mind', 'Better price found elsewhere', 'Not as described'];
        for (const order of completedOrders) {
            const returnDate = new Date(order.createdAt); returnDate.setDate(returnDate.getDate() + randomInt(1, 14));
            await client.query(
                `INSERT INTO returns (id, "storeId", "orderId", "customerId", reason, "returnedQuantity", status, "refundAmount", history, "dateRequested", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $9, $9)`,
                [crypto.randomUUID(), storeId, order.id, order.customerId, randomChoice(returnReasons),
                randomChoice(['Submitted', 'Approved', 'Rejected', 'Refunded']), order.total * 0.9,
                JSON.stringify([{ status: 'Submitted', date: returnDate.toISOString(), note: 'Return requested' }]), returnDate]
            );
        }
        console.log(`   ✅ Created ${completedOrders.length} returns`);

        // Set 5 products to low stock
        console.log('\n⚠️  Setting 5 products to low stock for inventory alerts...');
        for (const p of products.slice(0, 5)) {
            await client.query('UPDATE products SET "stockQuantity" = $1 WHERE id = $2', [randomInt(1, 5), p.id]);
        }
        console.log('   ✅ Low stock products set');

        console.log('\n' + '═'.repeat(50));
        console.log('✅ RESEED COMPLETE!');
        console.log('═'.repeat(50));
        console.log(`\n📊 Summary for store: ${storeName}`);
        console.log(`   • 30 Pakistan customers`);
        console.log(`   • 25 electronics products`);
        console.log(`   • 75 orders (past 6 months)`);
        console.log(`   • 10 return requests`);
        console.log(`   • 5 low-stock alerts`);
        console.log('\n🔐 Login: testuser@localhost.dev / test1234');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

reseedTestData();
