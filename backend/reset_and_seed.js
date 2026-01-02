/**
 * Complete Database Reset and Fresh Seed Script
 * Run with: node -r dotenv/config reset_and_seed.js
 * 
 * WARNING: This will DELETE ALL existing data!
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

// ==================== CONFIGURATION ====================

const STORES = [
    {
        id: crypto.randomUUID(),
        name: 'Demo Store',
        dashboardName: 'Demo Dashboard',
        slug: 'demo-store',
        currency: 'USD',
        isDemo: true,
        domain: 'demo.shopifyadmin.pk',
        country: 'USA',
        category: 'General',
    },
    {
        id: crypto.randomUUID(),
        name: 'Pakistan Electronics',
        dashboardName: 'Pakistan Store',
        slug: 'pakistan-electronics',
        currency: 'PKR',
        isDemo: false,
        domain: 'pk.shopifyadmin.pk',
        country: 'Pakistan',
        category: 'Electronics',
    }
];

const USERS = [
    {
        email: 'superadmin@apexit.co',
        password: 'admin1234',
        name: 'Super Admin',
        fullName: 'Apex IT Super Administrator',
        role: 'superadmin',
        storeIndex: 0, // Demo Store
        phone: '+1-555-0100'
    },
    {
        email: 'demo@demo.shopifyadmin.pk',
        password: 'demo1234',
        name: 'Demo Admin',
        fullName: 'Demo Store Administrator',
        role: 'admin',
        storeIndex: 0, // Demo Store
        phone: '+1-555-0101'
    },
    {
        email: 'store@gmail.com',
        password: 'store1234',
        name: 'Store Admin',
        fullName: 'Pakistan Store Administrator',
        role: 'admin',
        storeIndex: 1, // Pakistan Store
        phone: '+92-300-1234567'
    },
    {
        email: 'staff@gmail.com',
        password: 'staff1234',
        name: 'Staff Member',
        fullName: 'Pakistan Store Staff',
        role: 'staff',
        storeIndex: 1, // Pakistan Store
        phone: '+92-301-7654321'
    }
];

// USA Names and Data
const USA_FIRST_NAMES = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
const USA_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
const USA_CITIES = [
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Los Angeles', state: 'CA', zip: '90001' },
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Houston', state: 'TX', zip: '77001' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' },
    { city: 'San Francisco', state: 'CA', zip: '94102' },
    { city: 'Seattle', state: 'WA', zip: '98101' },
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Boston', state: 'MA', zip: '02101' },
    { city: 'Denver', state: 'CO', zip: '80201' },
];

// Pakistan Names and Data
const PK_FIRST_NAMES = ['Ahmed', 'Ali', 'Hassan', 'Usman', 'Bilal', 'Imran', 'Kashif', 'Zain', 'Faisal', 'Arslan',
    'Ayesha', 'Fatima', 'Sana', 'Hira', 'Zainab', 'Maryam', 'Amna', 'Rabia', 'Nadia', 'Sara'];
const PK_LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Malik', 'Hussain', 'Shah', 'Raza', 'Butt', 'Iqbal', 'Rehman',
    'Qureshi', 'Chaudhry', 'Siddiqui', 'Sheikh', 'Aslam', 'Farooq', 'Javed', 'Haider', 'Noor', 'Anwar'];
const PK_CITIES = [
    { city: 'Karachi', areas: ['DHA', 'Clifton', 'Gulshan-e-Iqbal', 'PECHS', 'Saddar'] },
    { city: 'Lahore', areas: ['DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Bahria Town'] },
    { city: 'Islamabad', areas: ['F-6', 'F-7', 'F-8', 'G-9', 'G-10', 'E-11', 'I-8'] },
    { city: 'Rawalpindi', areas: ['Saddar', 'Commercial Market', 'Bahria Town'] },
    { city: 'Faisalabad', areas: ['D Ground', 'Peoples Colony', 'Madina Town'] },
];

// USA Products (Demo Store)
const USA_PRODUCTS = [
    { name: 'Apple iPhone 15 Pro', price: 999.99, category: 'Electronics' },
    { name: 'Samsung Galaxy S24', price: 849.99, category: 'Electronics' },
    { name: 'MacBook Air M3', price: 1099.99, category: 'Electronics' },
    { name: 'Dell XPS 13', price: 999.99, category: 'Electronics' },
    { name: 'Sony WH-1000XM5', price: 349.99, category: 'Audio' },
    { name: 'AirPods Pro 2', price: 249.99, category: 'Audio' },
    { name: 'JBL Flip 6', price: 129.99, category: 'Audio' },
    { name: 'Apple Watch Series 9', price: 399.99, category: 'Wearables' },
    { name: 'Samsung Galaxy Watch 6', price: 299.99, category: 'Wearables' },
    { name: 'iPad Air 5', price: 599.99, category: 'Tablets' },
    { name: 'Samsung Galaxy Tab S9', price: 799.99, category: 'Tablets' },
    { name: 'Nintendo Switch OLED', price: 349.99, category: 'Gaming' },
    { name: 'PlayStation 5', price: 499.99, category: 'Gaming' },
    { name: 'Xbox Series X', price: 499.99, category: 'Gaming' },
    { name: 'Dyson V15 Vacuum', price: 749.99, category: 'Home' },
    { name: 'Instant Pot Pro', price: 129.99, category: 'Home' },
    { name: 'KitchenAid Mixer', price: 399.99, category: 'Home' },
    { name: 'Roomba i7+', price: 599.99, category: 'Home' },
    { name: 'Philips Hue Starter Kit', price: 199.99, category: 'Smart Home' },
    { name: 'Ring Video Doorbell', price: 99.99, category: 'Smart Home' },
    { name: 'Nest Thermostat', price: 129.99, category: 'Smart Home' },
    { name: 'Nike Air Max 90', price: 129.99, category: 'Fashion' },
    { name: 'Levi\'s 501 Jeans', price: 79.99, category: 'Fashion' },
    { name: 'Ray-Ban Aviators', price: 169.99, category: 'Fashion' },
    { name: 'Canon EOS R6 Mark II', price: 2499.99, category: 'Photography' },
    { name: 'Sony A7 IV', price: 2499.99, category: 'Photography' },
    { name: 'DJI Mini 3 Pro', price: 759.99, category: 'Photography' },
    { name: 'GoPro Hero 12', price: 399.99, category: 'Photography' },
    { name: 'Kindle Paperwhite', price: 139.99, category: 'Electronics' },
    { name: 'Anker PowerCore', price: 49.99, category: 'Accessories' },
];

// Pakistan Products
const PK_PRODUCTS = [
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
    { name: 'Keychron K2 Keyboard', price: 24999, category: 'Accessories' },
    { name: 'Samsung 55" QLED TV', price: 289999, category: 'TVs' },
    { name: 'LG C3 65" OLED TV', price: 449999, category: 'TVs' },
    { name: 'Sony PlayStation 5', price: 164999, category: 'Gaming' },
    { name: 'Xbox Series X', price: 154999, category: 'Gaming' },
    { name: 'Nintendo Switch OLED', price: 89999, category: 'Gaming' },
    { name: 'Razer DeathAdder V3', price: 19999, category: 'Gaming' },
    { name: 'Canon EOS R6 Mark II', price: 649999, category: 'Cameras' },
];

const ORDER_STATUSES = ['Pending', 'Accepted', 'Shipped', 'Completed'];
const RETURN_STATUSES = ['Submitted', 'Approved', 'Rejected', 'Refunded'];
const RETURN_REASONS = ['Defective product', 'Wrong item received', 'Changed mind', 'Better price found', 'Not as described'];

// ==================== HELPER FUNCTIONS ====================

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateUSAPhone() {
    return `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

function generatePKPhone() {
    const prefixes = ['300', '301', '302', '303', '304', '305', '321', '322', '323', '333'];
    return `+92-${randomChoice(prefixes)}-${randomInt(1000000, 9999999)}`;
}

function generateUSAAddress() {
    const city = randomChoice(USA_CITIES);
    return `${randomInt(100, 9999)} ${randomChoice(['Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm'])} ${randomChoice(['St', 'Ave', 'Blvd', 'Dr'])}, ${city.city}, ${city.state} ${city.zip}`;
}

function generatePKAddress() {
    const cityData = randomChoice(PK_CITIES);
    return `House ${randomInt(1, 500)}, Street ${randomInt(1, 50)}, ${randomChoice(cityData.areas)}, ${cityData.city}, Pakistan`;
}

function generateDateInRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return new Date(start + Math.random() * (end - start));
}

// ==================== MAIN SCRIPT ====================

async function resetAndSeed() {
    console.log('🔄 COMPLETE DATABASE RESET AND FRESH SEED');
    console.log('═'.repeat(60));
    console.log('⚠️  WARNING: This will DELETE ALL existing data!\n');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // ==================== PHASE 1: DELETE ALL DATA ====================
        console.log('🗑️  PHASE 1: Deleting all existing data...');

        // Delete in order to respect foreign key constraints
        const tablesToClear = ['returns', 'carts', 'orders', 'customers', 'products', 'users', 'stores'];
        for (const table of tablesToClear) {
            try {
                const result = await client.query(`DELETE FROM ${table}`);
                console.log(`   ✓ Deleted ${result.rowCount} rows from ${table}`);
            } catch (err) {
                console.log(`   ⚠ Could not clear ${table}: ${err.message}`);
            }
        }
        console.log('');

        // ==================== PHASE 2: CREATE STORES ====================
        console.log('🏪 PHASE 2: Creating stores...');

        for (const store of STORES) {
            await client.query(
                `INSERT INTO stores (id, name, "dashboardName", "defaultCurrency", "isDemo", domain, country, category, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
                [store.id, store.name, store.dashboardName, store.currency, store.isDemo, store.domain, store.country, store.category]
            );
            console.log(`   ✓ Created store: ${store.name} (${store.id})`);
        }
        console.log('');

        // ==================== PHASE 3: CREATE USERS ====================
        console.log('👤 PHASE 3: Creating users...');

        const userIds = [];
        for (const user of USERS) {
            const userId = crypto.randomUUID();
            userIds.push(userId);
            const passwordHash = bcrypt.hashSync(user.password, 10);
            const storeId = STORES[user.storeIndex].id;

            await client.query(
                `INSERT INTO users (id, email, "passwordHash", name, role, "storeId", "fullName", phone, active, "passwordChangedAt", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW(), NOW())`,
                [userId, user.email, passwordHash, user.name, user.role, storeId, user.fullName, user.phone]
            );
            console.log(`   ✓ Created ${user.role}: ${user.email} / ${user.password}`);
        }
        console.log('');

        // ==================== PHASE 4: SEED DEMO STORE (USA) ====================
        console.log('🇺🇸 PHASE 4: Seeding Demo Store (USA) - Nov 2025 to Mar 2026...');
        const demoStoreId = STORES[0].id;

        // Create USA customers (50+)
        const usaCustomers = [];
        for (let i = 0; i < 55; i++) {
            const firstName = randomChoice(USA_FIRST_NAMES);
            const lastName = randomChoice(USA_LAST_NAMES);
            const customer = {
                id: crypto.randomUUID(),
                storeId: demoStoreId,
                name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@gmail.com`,
                phone: generateUSAPhone(),
                address: generateUSAAddress(),
            };
            usaCustomers.push(customer);

            await client.query(
                `INSERT INTO customers (id, "storeId", name, email, phone, address, "alternativeNames", "alternativeEmails", "alternativePhones", "alternativeAddresses", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, '[]', '[]', '[]', '[]', NOW(), NOW())`,
                [customer.id, customer.storeId, customer.name, customer.email, customer.phone, customer.address]
            );
        }
        console.log(`   ✓ Created ${usaCustomers.length} USA customers`);

        // Create USA products (30)
        const usaProducts = [];
        for (const p of USA_PRODUCTS) {
            const product = {
                id: crypto.randomUUID(),
                storeId: demoStoreId,
                name: p.name,
                price: p.price,
                category: p.category,
                description: `High-quality ${p.name} with warranty and fast shipping.`,
                stockQuantity: randomInt(10, 200),
                reorderThreshold: 10,
                status: 'active',
            };
            usaProducts.push(product);

            await client.query(
                `INSERT INTO products (id, "storeId", name, description, price, "stockQuantity", "reorderThreshold", category, status, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                [product.id, product.storeId, product.name, product.description, product.price, product.stockQuantity, product.reorderThreshold, product.category, product.status]
            );
        }
        console.log(`   ✓ Created ${usaProducts.length} USA products`);

        // Create USA orders (150+) - Nov 2025 to Mar 2026
        const usaOrders = [];
        for (let i = 0; i < 160; i++) {
            const customer = randomChoice(usaCustomers);
            const product = randomChoice(usaProducts);
            const quantity = randomInt(1, 5);
            const status = randomChoice(ORDER_STATUSES);
            const isPaid = ['Accepted', 'Shipped', 'Completed'].includes(status);
            const orderDate = generateDateInRange('2025-11-01', '2026-03-31');

            const order = {
                id: crypto.randomUUID(),
                storeId: demoStoreId,
                customerId: customer.id,
                orderNumber: `DEMO-${String(i + 1).padStart(5, '0')}`,
                productName: product.name,
                customerName: customer.name,
                email: customer.email,
                phone: customer.phone,
                quantity,
                status,
                isPaid,
                total: product.price * quantity,
                timeline: JSON.stringify([{ status, date: orderDate.toISOString(), note: 'Order created' }]),
                items: JSON.stringify([{ productId: product.id, name: product.name, price: product.price, quantity }]),
                shippingAddress: JSON.stringify({ address: customer.address }),
                paymentStatus: isPaid ? 'paid' : 'pending',
                createdAt: orderDate,
            };
            usaOrders.push(order);

            await client.query(
                `INSERT INTO orders (id, "storeId", "customerId", "orderNumber", "productName", "customerName", email, phone, quantity, status, "isPaid", total, "submittedBy", timeline, items, "shippingAddress", "paymentStatus", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18, $18)`,
                [order.id, order.storeId, order.customerId, order.orderNumber, order.productName, order.customerName, order.email, order.phone, order.quantity, order.status, order.isPaid, order.total, null, order.timeline, order.items, order.shippingAddress, order.paymentStatus, order.createdAt]
            );
        }
        console.log(`   ✓ Created ${usaOrders.length} USA orders (Nov 2025 - Mar 2026)`);

        // Create USA returns (15+)
        const completedUsaOrders = usaOrders.filter(o => ['Shipped', 'Completed'].includes(o.status)).slice(0, 18);
        for (const order of completedUsaOrders) {
            const returnDate = new Date(order.createdAt);
            returnDate.setDate(returnDate.getDate() + randomInt(3, 14));

            await client.query(
                `INSERT INTO returns (id, "storeId", "orderId", "customerId", reason, "returnedQuantity", status, "refundAmount", history, "dateRequested", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $9, $9)`,
                [crypto.randomUUID(), demoStoreId, order.id, order.customerId, randomChoice(RETURN_REASONS),
                randomChoice(RETURN_STATUSES), order.total * 0.95,
                JSON.stringify([{ status: 'Submitted', date: returnDate.toISOString(), note: 'Return requested by customer' }]), returnDate]
            );
        }
        console.log(`   ✓ Created ${completedUsaOrders.length} USA returns`);

        // Set low stock for some USA products
        for (const p of usaProducts.slice(0, 6)) {
            await client.query('UPDATE products SET "stockQuantity" = $1 WHERE id = $2', [randomInt(1, 5), p.id]);
        }
        console.log('   ✓ Set 6 products to low stock\n');

        // ==================== PHASE 5: SEED PAKISTAN STORE ====================
        console.log('🇵🇰 PHASE 5: Seeding Pakistan Store...');
        const pkStoreId = STORES[1].id;

        // Create PK customers (30+)
        const pkCustomers = [];
        for (let i = 0; i < 35; i++) {
            const firstName = randomChoice(PK_FIRST_NAMES);
            const lastName = randomChoice(PK_LAST_NAMES);
            const customer = {
                id: crypto.randomUUID(),
                storeId: pkStoreId,
                name: `${firstName} ${lastName}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@gmail.com`,
                phone: generatePKPhone(),
                address: generatePKAddress(),
            };
            pkCustomers.push(customer);

            await client.query(
                `INSERT INTO customers (id, "storeId", name, email, phone, address, "alternativeNames", "alternativeEmails", "alternativePhones", "alternativeAddresses", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, '[]', '[]', '[]', '[]', NOW(), NOW())`,
                [customer.id, customer.storeId, customer.name, customer.email, customer.phone, customer.address]
            );
        }
        console.log(`   ✓ Created ${pkCustomers.length} Pakistan customers`);

        // Create PK products (25)
        const pkProducts = [];
        for (const p of PK_PRODUCTS) {
            const product = {
                id: crypto.randomUUID(),
                storeId: pkStoreId,
                name: p.name,
                price: p.price,
                category: p.category,
                description: `High-quality ${p.name} available at best price in Pakistan.`,
                stockQuantity: randomInt(5, 100),
                reorderThreshold: 10,
                status: 'active',
            };
            pkProducts.push(product);

            await client.query(
                `INSERT INTO products (id, "storeId", name, description, price, "stockQuantity", "reorderThreshold", category, status, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                [product.id, product.storeId, product.name, product.description, product.price, product.stockQuantity, product.reorderThreshold, product.category, product.status]
            );
        }
        console.log(`   ✓ Created ${pkProducts.length} Pakistan products`);

        // Create PK orders (80+)
        const pkOrders = [];
        for (let i = 0; i < 85; i++) {
            const customer = randomChoice(pkCustomers);
            const product = randomChoice(pkProducts);
            const quantity = randomInt(1, 3);
            const status = randomChoice(ORDER_STATUSES);
            const isPaid = ['Accepted', 'Shipped', 'Completed'].includes(status);
            const daysAgo = randomInt(0, 180);
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - daysAgo);

            const order = {
                id: crypto.randomUUID(),
                storeId: pkStoreId,
                customerId: customer.id,
                orderNumber: `PKE-${String(i + 1).padStart(5, '0')}`,
                productName: product.name,
                customerName: customer.name,
                email: customer.email,
                phone: customer.phone,
                quantity,
                status,
                isPaid,
                total: product.price * quantity,
                timeline: JSON.stringify([{ status, date: orderDate.toISOString(), note: 'Order created' }]),
                items: JSON.stringify([{ productId: product.id, name: product.name, price: product.price, quantity }]),
                shippingAddress: JSON.stringify({ address: customer.address }),
                paymentStatus: isPaid ? 'paid' : 'pending',
                createdAt: orderDate,
            };
            pkOrders.push(order);

            await client.query(
                `INSERT INTO orders (id, "storeId", "customerId", "orderNumber", "productName", "customerName", email, phone, quantity, status, "isPaid", total, "submittedBy", timeline, items, "shippingAddress", "paymentStatus", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18, $18)`,
                [order.id, order.storeId, order.customerId, order.orderNumber, order.productName, order.customerName, order.email, order.phone, order.quantity, order.status, order.isPaid, order.total, null, order.timeline, order.items, order.shippingAddress, order.paymentStatus, order.createdAt]
            );
        }
        console.log(`   ✓ Created ${pkOrders.length} Pakistan orders (last 6 months)`);

        // Create PK returns (12)
        const completedPkOrders = pkOrders.filter(o => ['Shipped', 'Completed'].includes(o.status)).slice(0, 12);
        for (const order of completedPkOrders) {
            const returnDate = new Date(order.createdAt);
            returnDate.setDate(returnDate.getDate() + randomInt(1, 14));

            await client.query(
                `INSERT INTO returns (id, "storeId", "orderId", "customerId", reason, "returnedQuantity", status, "refundAmount", history, "dateRequested", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $9, $9)`,
                [crypto.randomUUID(), pkStoreId, order.id, order.customerId, randomChoice(RETURN_REASONS),
                randomChoice(RETURN_STATUSES), order.total * 0.9,
                JSON.stringify([{ status: 'Submitted', date: returnDate.toISOString(), note: 'Return requested' }]), returnDate]
            );
        }
        console.log(`   ✓ Created ${completedPkOrders.length} Pakistan returns`);

        // Set low stock for some PK products
        for (const p of pkProducts.slice(0, 5)) {
            await client.query('UPDATE products SET "stockQuantity" = $1 WHERE id = $2', [randomInt(1, 5), p.id]);
        }
        console.log('   ✓ Set 5 products to low stock\n');

        // ==================== SUMMARY ====================
        console.log('═'.repeat(60));
        console.log('✅ DATABASE RESET AND SEED COMPLETE!');
        console.log('═'.repeat(60));
        console.log('\n📊 SUMMARY:');
        console.log('─'.repeat(40));
        console.log('STORES:');
        for (const store of STORES) {
            console.log(`  • ${store.name} (${store.country})`);
        }
        console.log('\nUSERS:');
        for (const user of USERS) {
            console.log(`  • ${user.email} / ${user.password} [${user.role}]`);
        }
        console.log('\nDATA:');
        console.log(`  Demo Store (USA): ${usaCustomers.length} customers, ${usaProducts.length} products, ${usaOrders.length} orders, ${completedUsaOrders.length} returns`);
        console.log(`  Pakistan Store: ${pkCustomers.length} customers, ${pkProducts.length} products, ${pkOrders.length} orders, ${completedPkOrders.length} returns`);
        console.log('\n🌐 URLS:');
        console.log('  Local:      http://127.0.0.1:5173/login');
        console.log('  Production: https://inventory.apexitsolutions.co/login');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

resetAndSeed();
