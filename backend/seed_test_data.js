/**
 * Seed comprehensive test data for testuser@localhost.dev
 * Run with: node -r dotenv/config seed_test_data.js
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

const ORDER_STATUSES = ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'];
const RETURN_REASONS = ['Defective product', 'Wrong item received', 'Changed mind', 'Better price found elsewhere', 'Not as described'];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
    const prefixes = ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313', '314', '315', '320', '321', '322', '323', '324', '325', '330', '331', '332', '333', '334', '335'];
    return `+92-${randomChoice(prefixes)}-${randomInt(1000000, 9999999)}`;
}

function generateAddress() {
    const cityData = randomChoice(PAKISTAN_CITIES);
    const houseNo = randomInt(1, 500);
    const street = randomInt(1, 50);
    return `House ${houseNo}, Street ${street}, ${randomChoice(cityData.areas)}, ${cityData.city}, Pakistan`;
}

function generateCustomer(storeId, index) {
    const firstName = randomChoice(PAKISTANI_FIRST_NAMES);
    const lastName = randomChoice(PAKISTANI_LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@gmail.com`;

    return {
        id: crypto.randomUUID(),
        storeId,
        name,
        email,
        phone: generatePhone(),
        address: generateAddress(),
        alternativeNames: [],
        alternativeEmails: [],
        alternativePhones: [],
        alternativeAddresses: [],
    };
}

function generateProduct(storeId, productData) {
    return {
        id: crypto.randomUUID(),
        storeId,
        name: productData.name,
        description: `High-quality ${productData.name} available at the best price in Pakistan. Genuine product with warranty.`,
        price: productData.price,
        stockQuantity: randomInt(5, 100),
        reorderThreshold: 10,
        category: productData.category,
        imageUrl: null,
        status: 'active',
    };
}

function generateOrder(storeId, customer, products, index) {
    const product = randomChoice(products);
    const quantity = randomInt(1, 3);
    const status = randomChoice(ORDER_STATUSES);
    const isPaid = ['Paid', 'Accepted', 'Shipped', 'Completed'].includes(status);

    // Generate order date within last 6 months
    const daysAgo = randomInt(0, 180);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);

    return {
        id: crypto.randomUUID(),
        storeId,
        customerId: customer.id,
        orderNumber: `ORD-${String(index).padStart(5, '0')}`,
        productName: product.name,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        quantity,
        status,
        isPaid,
        total: product.price * quantity,
        notes: null,
        submittedBy: 'Website',
        timeline: JSON.stringify([{ status, date: orderDate.toISOString(), note: 'Order created' }]),
        items: JSON.stringify([{ productId: product.id, name: product.name, price: product.price, quantity }]),
        shippingAddress: customer.address,
        paymentStatus: isPaid ? 'paid' : 'pending',
        createdAt: orderDate,
        updatedAt: orderDate,
    };
}

function generateReturn(storeId, order, customer, index) {
    const returnDate = new Date(order.createdAt);
    returnDate.setDate(returnDate.getDate() + randomInt(1, 14));

    return {
        id: crypto.randomUUID(),
        storeId,
        orderId: order.id,
        customerId: customer.id,
        productId: null,
        reason: randomChoice(RETURN_REASONS),
        returnedQuantity: 1,
        status: randomChoice(['Submitted', 'Approved', 'Rejected', 'Refunded']),
        refundAmount: order.total * 0.9, // 90% refund
        history: JSON.stringify([{ status: 'Submitted', date: returnDate.toISOString(), note: 'Return requested by customer' }]),
        dateRequested: returnDate,
        createdAt: returnDate,
        updatedAt: returnDate,
    };
}

async function seedTestData() {
    console.log('🌱 Seeding test data for testuser@localhost.dev...\n');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

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

        // Check if data already exists for this store
        const existingProducts = await client.query('SELECT COUNT(*) FROM products WHERE "storeId" = $1', [storeId]);
        if (parseInt(existingProducts.rows[0].count) > 10) {
            console.log(`⚠️  Store already has ${existingProducts.rows[0].count} products. Skipping seed to avoid duplicates.`);
            console.log('   If you want to re-seed, delete existing data first.');
            return;
        }

        // Generate customers (30)
        console.log('\n📦 Generating customers...');
        const customers = [];
        for (let i = 0; i < 30; i++) {
            customers.push(generateCustomer(storeId, i));
        }

        for (const customer of customers) {
            await client.query(
                `INSERT INTO customers (id, "storeId", name, email, phone, address, "alternativeNames", "alternativeEmails", "alternativePhones", "alternativeAddresses", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
                [customer.id, customer.storeId, customer.name, customer.email, customer.phone, customer.address,
                JSON.stringify(customer.alternativeNames), JSON.stringify(customer.alternativeEmails),
                JSON.stringify(customer.alternativePhones), JSON.stringify(customer.alternativeAddresses)]
            );
        }
        console.log(`   ✅ Created ${customers.length} customers`);

        // Generate products (25)
        console.log('\n📱 Generating products...');
        const products = [];
        for (const productData of ELECTRONICS_PRODUCTS) {
            products.push(generateProduct(storeId, productData));
        }

        for (const product of products) {
            await client.query(
                `INSERT INTO products (id, "storeId", name, description, price, "stockQuantity", "reorderThreshold", category, "imageUrl", status, "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
                [product.id, product.storeId, product.name, product.description, product.price,
                product.stockQuantity, product.reorderThreshold, product.category, product.imageUrl, product.status]
            );
        }
        console.log(`   ✅ Created ${products.length} products`);

        // Generate orders (75)
        console.log('\n📋 Generating orders...');
        const orders = [];
        for (let i = 0; i < 75; i++) {
            const customer = randomChoice(customers);
            orders.push(generateOrder(storeId, customer, products, i + 1));
        }

        for (const order of orders) {
            await client.query(
                `INSERT INTO orders (id, "storeId", "customerId", "orderNumber", "productName", "customerName", email, phone, quantity, status, "isPaid", total, notes, "submittedBy", timeline, items, "shippingAddress", "paymentStatus", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                [order.id, order.storeId, order.customerId, order.orderNumber, order.productName, order.customerName,
                order.email, order.phone, order.quantity, order.status, order.isPaid, order.total, order.notes,
                order.submittedBy, order.timeline, order.items, order.shippingAddress, order.paymentStatus,
                order.createdAt, order.updatedAt]
            );
        }
        console.log(`   ✅ Created ${orders.length} orders`);

        // Generate returns (~10% of orders = 8)
        console.log('\n🔄 Generating returns...');
        const completedOrders = orders.filter(o => ['Shipped', 'Completed'].includes(o.status));
        const returnsToCreate = Math.min(8, completedOrders.length);
        const returns = [];

        for (let i = 0; i < returnsToCreate; i++) {
            const order = completedOrders[i];
            const customer = customers.find(c => c.id === order.customerId);
            if (customer) {
                returns.push(generateReturn(storeId, order, customer, i + 1));
            }
        }

        for (const ret of returns) {
            await client.query(
                `INSERT INTO returns (id, "storeId", "orderId", "customerId", "productId", reason, "returnedQuantity", status, "refundAmount", history, "dateRequested", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [ret.id, ret.storeId, ret.orderId, ret.customerId, ret.productId, ret.reason,
                ret.returnedQuantity, ret.status, ret.refundAmount, ret.history, ret.dateRequested,
                ret.createdAt, ret.updatedAt]
            );
        }
        console.log(`   ✅ Created ${returns.length} returns`);

        // Create some low-stock products for inventory alerts
        console.log('\n⚠️  Setting some products to low stock...');
        const lowStockProducts = products.slice(0, 5);
        for (const product of lowStockProducts) {
            await client.query(
                'UPDATE products SET "stockQuantity" = $1 WHERE id = $2',
                [randomInt(1, 5), product.id]
            );
        }
        console.log(`   ✅ Set ${lowStockProducts.length} products to low stock`);

        console.log('\n' + '═'.repeat(50));
        console.log('✅ SEED COMPLETE!');
        console.log('═'.repeat(50));
        console.log(`\n📊 Summary for store: ${storeName}`);
        console.log(`   • 30 Pakistan customers`);
        console.log(`   • 25 electronics products`);
        console.log(`   • 75 orders (past 6 months)`);
        console.log(`   • ${returns.length} return requests`);
        console.log(`   • 5 low-stock alerts`);
        console.log('\n🔐 Login: testuser@localhost.dev / test1234');
        console.log('🌐 URL: http://localhost:5173/login (or check terminal for port)');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
    }
}

seedTestData();
