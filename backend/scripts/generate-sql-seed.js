const { generateMultiStoreData } = require('../generateMultiStoreData');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Helper to escape SQL strings
const escape = (str) => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
    if (typeof str === 'number') return str;
    // Replace single quotes with two single quotes
    return `'${String(str).replace(/'/g, "''")}'`;
};

// Helper to format date for SQL
const formatDate = (date) => {
    if (!date) return 'NULL';
    return `'${new Date(date).toISOString()}'`;
};

// Helper to stringify JSON
const formatJson = (obj) => {
    if (!obj) return "'{}'";
    return `'${JSON.stringify(obj).replace(/'/g, "''")}'`;
};

const data = generateMultiStoreData();
const sql = [];

sql.push('-- Supabase Seed Data (Generated)');
sql.push('-- 5 Stores (2025), Demo (2025-2026), Superadmin');
sql.push('');

// 1. Stores
sql.push('-- Stores');
data.stores.forEach(store => {
    sql.push(`INSERT INTO stores (id, name, "dashboardName", domain, category, "defaultCurrency", country, "logoUrl", "brandColor", "isDemo", "createdAt", "updatedAt") VALUES (
    ${escape(store.id)},
    ${escape(store.name)},
    ${escape(store.dashboardName)},
    ${escape(store.domain)},
    ${escape(store.category)},
    ${escape(store.defaultCurrency || 'PKR')},
    ${escape(store.country || 'PK')},
    ${escape(store.logoUrl)},
    ${escape(store.brandColor || '#1976d2')},
    ${escape(store.isDemo || false)},
    NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;`);
});

// Demo Store
const demoStoreId = crypto.randomUUID();
sql.push(`INSERT INTO stores (id, name, "dashboardName", domain, category, "defaultCurrency", country, "logoUrl", "brandColor", "isDemo", "createdAt", "updatedAt") VALUES (
  '${demoStoreId}',
  'Demo Store',
  'Demo Store',
  'demo.shopifyadmin.pk',
  'General',
  'PKR',
  'PK',
  NULL,
  '#1976d2',
  TRUE,
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;`);

sql.push('');

// 2. Users
sql.push('-- Users');
// Superadmin
const superAdminPass = bcrypt.hashSync('superadmin123', 10);
sql.push(`INSERT INTO users (id, email, "passwordHash", name, role, "storeId", "fullName", phone, "profilePictureUrl", "defaultDateRangeFilter", "notificationPreferences", permissions, active, "passwordChangedAt", "createdAt", "updatedAt") VALUES (
  '${crypto.randomUUID()}',
  'superadmin@shopifyadmin.pk',
  '${superAdminPass}',
  'Super Admin',
  'superadmin',
  NULL,
  'Super Administrator',
  '+92-300-0000000',
  NULL,
  'last7',
  ${formatJson({ newOrders: true, lowStock: true, returnsPending: true })},
  ${formatJson({ viewOrders: true, editOrders: true, deleteOrders: true, viewProducts: true, editProducts: true, deleteProducts: true, viewCustomers: true, editCustomers: true, viewReturns: true, processReturns: true, viewReports: true, manageUsers: true, manageSettings: true })},
  TRUE,
  NOW(), NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;`);

// Demo User
const demoUserPass = bcrypt.hashSync('demo123', 10);
sql.push(`INSERT INTO users (id, email, "passwordHash", name, role, "storeId", "fullName", phone, "profilePictureUrl", "defaultDateRangeFilter", "notificationPreferences", permissions, active, "passwordChangedAt", "createdAt", "updatedAt") VALUES (
  '${crypto.randomUUID()}',
  'demo@shopifyadmin.pk',
  '${demoUserPass}',
  'Demo User',
  'admin',
  '${demoStoreId}',
  'Demo Administrator',
  '+92-300-0000001',
  NULL,
  'last7',
  ${formatJson({ newOrders: true, lowStock: true, returnsPending: true })},
  '{}',
  TRUE,
  NOW(), NOW(), NOW()
) ON CONFLICT (email) DO NOTHING;`);

// Regular Users
data.users.forEach(user => {
    sql.push(`INSERT INTO users (id, email, "passwordHash", name, role, "storeId", "fullName", phone, "profilePictureUrl", "defaultDateRangeFilter", "notificationPreferences", permissions, active, "passwordChangedAt", "createdAt", "updatedAt") VALUES (
    ${escape(user.id)},
    ${escape(user.email)},
    ${escape(user.passwordHash)},
    ${escape(user.name)},
    ${escape(user.role)},
    ${escape(user.storeId)},
    ${escape(user.fullName || user.name)},
    ${escape(user.phone)},
    ${escape(user.profilePictureUrl)},
    ${escape(user.defaultDateRangeFilter || 'last7')},
    ${formatJson(user.notificationPreferences)},
    ${formatJson(user.permissions)},
    ${escape(user.active !== undefined ? user.active : true)},
    NOW(),
    ${formatDate(user.createdAt)},
    ${formatDate(user.updatedAt)}
  ) ON CONFLICT (email) DO NOTHING;`);
});

sql.push('');

// 3. Products
sql.push('-- Products');
data.products.forEach(p => {
    sql.push(`INSERT INTO products (id, "storeId", name, description, price, "stockQuantity", "reorderThreshold", category, "imageUrl", status, "createdAt", "updatedAt") VALUES (
    ${escape(p.id)},
    ${escape(p.storeId)},
    ${escape(p.name)},
    ${escape(p.description)},
    ${escape(p.price)},
    ${escape(p.stockQuantity)},
    ${escape(p.reorderThreshold)},
    ${escape(p.category)},
    ${escape(p.imageUrl)},
    ${escape(p.status)},
    ${formatDate(p.createdAt)},
    ${formatDate(p.updatedAt)}
  );`);
});

sql.push('');

// 4. Customers
sql.push('-- Customers');
data.customers.forEach(c => {
    sql.push(`INSERT INTO customers (id, "storeId", name, email, phone, address, "alternativeNames", "alternativeEmails", "alternativePhones", "alternativeAddresses", "createdAt", "updatedAt") VALUES (
    ${escape(c.id)},
    ${escape(c.storeId)},
    ${escape(c.name)},
    ${escape(c.email)},
    ${escape(c.phone)},
    ${escape(c.address)},
    ${formatJson(c.alternativeNames || [])},
    ${formatJson(c.alternativeEmails || [])},
    ${formatJson(c.alternativePhones || [])},
    ${formatJson(c.alternativeAddresses || [])},
    ${formatDate(c.createdAt)},
    ${formatDate(c.updatedAt)}
  );`);
});

sql.push('');

// 5. Orders
sql.push('-- Orders');
data.orders.forEach(o => {
    sql.push(`INSERT INTO orders (id, "storeId", "customerId", "orderNumber", "productName", "customerName", email, phone, quantity, status, "isPaid", total, notes, "submittedBy", timeline, items, "shippingAddress", "paymentStatus", "createdAt", "updatedAt") VALUES (
    ${escape(o.id)},
    ${escape(o.storeId)},
    ${escape(o.customerId)},
    ${escape(o.orderNumber)},
    ${escape(o.productName)},
    ${escape(o.customerName)},
    ${escape(o.email)},
    ${escape(o.phone)},
    ${escape(o.quantity)},
    ${escape(o.status)},
    ${escape(o.isPaid)},
    ${escape(o.total)},
    ${escape(o.notes)},
    ${escape(o.submittedBy)},
    ${formatJson(o.timeline)},
    ${formatJson(o.items)},
    ${escape(o.shippingAddress)},
    ${escape(o.paymentStatus)},
    ${formatDate(o.createdAt)},
    ${formatDate(o.updatedAt)}
  );`);
});

sql.push('');

// 6. Returns
sql.push('-- Returns');
data.returns.forEach(r => {
    sql.push(`INSERT INTO returns (id, "storeId", "orderId", "customerId", "productId", reason, "returnedQuantity", status, "refundAmount", history, "dateRequested", "createdAt", "updatedAt") VALUES (
    ${escape(r.id)},
    ${escape(r.storeId)},
    ${escape(r.orderId)},
    ${escape(r.customerId)},
    ${escape(r.productId)},
    ${escape(r.reason)},
    ${escape(r.returnedQuantity)},
    ${escape(r.status)},
    ${escape(r.refundAmount)},
    ${formatJson(r.history)},
    ${formatDate(r.dateRequested)},
    ${formatDate(r.createdAt)},
    ${formatDate(r.updatedAt)}
  );`);
});

sql.push('');

// 7. Settings
sql.push('-- Settings');
data.stores.forEach(store => {
    sql.push(`INSERT INTO settings (id, "storeId", "logoUrl", "brandColor", "defaultCurrency", country, "dashboardName", "defaultOrderStatuses", "createdAt", "updatedAt") VALUES (
    '${crypto.randomUUID()}',
    ${escape(store.id)},
    ${escape(store.logoUrl)},
    ${escape(store.brandColor || '#1976d2')},
    ${escape(store.defaultCurrency || 'PKR')},
    ${escape(store.country || 'PK')},
    ${escape(store.dashboardName)},
    ${formatJson(['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'])},
    NOW(), NOW()
  );`);
});

// Demo Settings
sql.push(`INSERT INTO settings (id, "storeId", "logoUrl", "brandColor", "defaultCurrency", country, "dashboardName", "defaultOrderStatuses", "createdAt", "updatedAt") VALUES (
  '${crypto.randomUUID()}',
  '${demoStoreId}',
  NULL,
  '#1976d2',
  'PKR',
  'PK',
  'Demo Store',
  ${formatJson(['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'])},
  NOW(), NOW()
);`);

console.log(sql.join('\n'));
