#!/usr/bin/env node
/**
 * Database Reset and Seed Script
 * 
 * This script:
 * 1. Clears all existing data (orders, returns, customers, products, users, settings, stores)
 * 2. Seeds fresh data with documented credentials
 * 
 * Usage: 
 *   Development (full seed): node reset_db.js
 *   Production (light seed): SEED_MODE=production node reset_db.js
 * 
 * Seed Modes:
 *   - development (default): Seeds 5 client stores + 1 demo store + superadmin (thousands of rows)
 *   - production: Seeds superadmin + 1 demo store + TechHub store (minimal data for production setup)
 */

require('dotenv').config()
const { initializeDatabase, db } = require('./db/init')
const { generateMultiStoreData } = require('./generateMultiStoreData')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const { Store, User, Product, Customer, Order, Return, Setting } = db

// Get seed mode from environment (default: development)
const SEED_MODE = (process.env.SEED_MODE || 'development').toLowerCase()
const SUPPORTED_SEED_MODES = ['development', 'production']
if (!SUPPORTED_SEED_MODES.includes(SEED_MODE)) {
    throw new Error(`Invalid SEED_MODE: ${SEED_MODE}. Supported modes: ${SUPPORTED_SEED_MODES.join(', ')}`)
}

// Get database dialect
const dialect = db.sequelize.getDialect()

async function resetAndSeedDatabase() {
    try {
        console.log(`🔄 Initializing database connection (dialect: ${dialect}, seed mode: ${SEED_MODE})...`)
        await initializeDatabase()

        console.log('🗑️  Clearing all existing data...')

        // Ensure storeId can be null for superadmin (dialect-agnostic approach)
        try {
            if (dialect === 'mysql') {
                // MySQL-specific syntax
                await db.sequelize.query(`
          ALTER TABLE users DROP FOREIGN KEY IF EXISTS users_ibfk_1
        `).catch(() => {
                    // Try alternative constraint name
                    return db.sequelize.query(`
            ALTER TABLE users DROP FOREIGN KEY IF EXISTS users_storeId_fkey
          `)
                }).catch(() => {
                    // Ignore if constraint doesn't exist
                })

                await db.sequelize.query(`
          ALTER TABLE users 
          MODIFY COLUMN storeId CHAR(36) NULL
        `)

                await db.sequelize.query(`
          ALTER TABLE users 
          ADD CONSTRAINT users_ibfk_1 
          FOREIGN KEY (storeId) REFERENCES stores(id) 
          ON UPDATE CASCADE ON DELETE CASCADE
        `).catch(() => {
                    // Ignore if constraint already exists
                })
            } else if (dialect === 'postgres') {
                // Postgres-specific syntax
                await db.sequelize.query(`
          ALTER TABLE users DROP CONSTRAINT IF EXISTS users_storeId_fkey
        `).catch(() => {
                    // Ignore if constraint doesn't exist
                })

                await db.sequelize.query(`
          ALTER TABLE users 
          ALTER COLUMN "storeId" DROP NOT NULL
        `)

                await db.sequelize.query(`
          ALTER TABLE users 
          ADD CONSTRAINT users_storeId_fkey 
          FOREIGN KEY ("storeId") REFERENCES stores(id) 
          ON UPDATE CASCADE ON DELETE CASCADE
        `).catch(() => {
                    // Ignore if constraint already exists
                })
            }

            console.log('✅ Updated users table to allow null storeId for superadmin')
        } catch (error) {
            console.log(`ℹ️  storeId column update: ${error.message}`)
            // Continue anyway - might already be nullable
        }

        // Clear data in correct order (respecting foreign keys)
        await Return.destroy({ where: {}, force: true })
        await Order.destroy({ where: {}, force: true })
        await Customer.destroy({ where: {}, force: true })
        await Product.destroy({ where: {}, force: true })
        await User.destroy({ where: {}, force: true })
        await Setting.destroy({ where: {}, force: true })
        await Store.destroy({ where: {}, force: true })

        console.log('✅ All data cleared')

        // Determine what to seed based on mode
        if (SEED_MODE === 'production') {
            console.log('🌱 Production seed mode: Creating superadmin + populated Demo Store + TechHub Store...')

            // Generate full data set
            const multiStoreData = generateMultiStoreData()

            // 1. Identify Stores to Seed (Demo + TechHub)
            const demoStore = multiStoreData.stores.find(s => s.isDemo)
            const techHubStore = multiStoreData.stores.find(s => s.domain === 'techhub.pk')

            if (!demoStore) throw new Error('Demo store template not found in generator')
            if (!techHubStore) throw new Error('TechHub store template not found in generator')

            const storesToSeed = [demoStore, techHubStore]
            const storeIds = storesToSeed.map(s => s.id)

            // 2. Filter Data for these stores
            const targetUsers = multiStoreData.users.filter(u => storeIds.includes(u.storeId))
            const targetProducts = multiStoreData.products.filter(p => storeIds.includes(p.storeId))
            const targetCustomers = multiStoreData.customers.filter(c => storeIds.includes(c.storeId))
            const targetOrders = multiStoreData.orders.filter(o => storeIds.includes(o.storeId))
            const targetReturns = multiStoreData.returns.filter(r => storeIds.includes(r.storeId))

            console.log(`[DEBUG] Dialect: ${db.sequelize.getDialect()}`)
            console.log(`[DEBUG] Stores to Seed: ${storesToSeed.map(s => s.name).join(', ')}`)
            console.log(`[DEBUG] Total Orders: ${targetOrders.length}`)

            // 3. Seed Stores
            console.log(`📦 Seeding ${storesToSeed.length} stores...`)
            await Store.bulkCreate(storesToSeed.map(store => ({
                id: store.id,
                name: store.name,
                dashboardName: store.dashboardName,
                domain: store.domain,
                category: store.category,
                defaultCurrency: store.defaultCurrency || 'PKR',
                country: store.country || 'PK',
                logoUrl: store.logoUrl || null,
                brandColor: store.brandColor || '#1976d2',
                isDemo: store.isDemo || false,
            })))

            // 4. Seed Users
            console.log(`👥 Seeding ${targetUsers.length} users...`)
            await User.bulkCreate(targetUsers.map(user => ({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                name: user.name,
                role: user.role,
                storeId: user.storeId,
                fullName: user.fullName || user.name,
                phone: user.phone || null,
                profilePictureUrl: user.profilePictureUrl || null,
                defaultDateRangeFilter: user.defaultDateRangeFilter || 'last7',
                notificationPreferences: user.notificationPreferences || {
                    newOrders: true,
                    lowStock: true,
                    returnsPending: true,
                },
                permissions: user.permissions || {},
                active: true,
                passwordChangedAt: new Date(),
                createdAt: user.createdAt || new Date(),
                updatedAt: user.updatedAt || user.createdAt || new Date(),
            })))

            // Create superadmin
            const superAdminPassword = bcrypt.hashSync('superadmin123', 10)
            await User.create({
                email: 'superadmin@shopifyadmin.pk',
                passwordHash: superAdminPassword,
                name: 'Super Admin',
                role: 'superadmin',
                storeId: null,
                fullName: 'Super Administrator',
                phone: '+92-300-0000000',
                profilePictureUrl: null,
                defaultDateRangeFilter: 'last7',
                notificationPreferences: {
                    newOrders: true,
                    lowStock: true,
                    returnsPending: true,
                },
                permissions: {
                    viewOrders: true, editOrders: true, deleteOrders: true,
                    viewProducts: true, editProducts: true, deleteProducts: true,
                    viewCustomers: true, editCustomers: true,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: true, manageSettings: true,
                },
                active: true,
                passwordChangedAt: new Date(),
            })

            // 5. Seed Products
            console.log(`📦 Seeding ${targetProducts.length} products...`)
            await Product.bulkCreate(targetProducts.map(product => ({
                id: product.id,
                storeId: product.storeId,
                name: product.name,
                description: product.description || '',
                price: product.price || 0,
                stockQuantity: product.stockQuantity || 0,
                reorderThreshold: product.reorderThreshold || 10,
                category: product.category || 'Uncategorized',
                imageUrl: product.imageUrl || null,
                status: product.status || 'active',
                createdAt: product.createdAt || new Date(),
                updatedAt: product.updatedAt || product.createdAt || new Date(),
            })))

            // 6. Seed Customers
            console.log(`👤 Seeding ${targetCustomers.length} customers...`)
            const BATCH_SIZE = 50
            for (let i = 0; i < targetCustomers.length; i += BATCH_SIZE) {
                try {
                    const batch = targetCustomers.slice(i, i + BATCH_SIZE).map(c => ({
                        ...c,
                        createdAt: c.createdAt || new Date().toISOString(),
                        updatedAt: c.updatedAt || c.createdAt || new Date().toISOString()
                    }))
                    await Customer.bulkCreate(batch)
                    console.log(`   Processed customers ${i + batch.length}/${targetCustomers.length}`)
                } catch (err) {
                    console.error(`❌ Error seeding customers batch ${i}:`, err.message)
                    throw err
                }
            }

            // 7. Seed Orders
            console.log(`📋 Seeding ${targetOrders.length} orders...`)
            for (let i = 0; i < targetOrders.length; i += BATCH_SIZE) {
                try {
                    const batch = targetOrders.slice(i, i + BATCH_SIZE).map(o => ({
                        ...o,
                        createdAt: o.createdAt || new Date().toISOString(),
                        updatedAt: o.updatedAt || o.createdAt || new Date().toISOString()
                    }))
                    await Order.bulkCreate(batch)
                    console.log(`   Processed orders ${i + batch.length}/${targetOrders.length}`)
                } catch (err) {
                    console.error(`❌ Error seeding orders batch ${i}:`, err.message)
                    throw err
                }
            }

            // 8. Seed Returns
            console.log(`↩️  Seeding ${targetReturns.length} returns...`)
            await Return.bulkCreate(targetReturns.map(r => ({
                ...r,
                createdAt: r.createdAt || new Date().toISOString(),
                updatedAt: r.updatedAt || r.createdAt || new Date().toISOString()
            })))

            // 9. Seed Settings
            console.log('⚙️  Seeding settings...')
            await Setting.bulkCreate(storesToSeed.map(store => ({
                id: crypto.randomUUID(),
                storeId: store.id,
                logoUrl: null,
                brandColor: store.brandColor || '#1976d2',
                defaultCurrency: 'PKR',
                country: 'PK',
                dashboardName: store.dashboardName,
                defaultOrderStatuses: ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'],
            })))

            console.log('✅ Production seed completed successfully!')
            console.log('\n📊 Summary:')
            console.log(`   Stores: ${storesToSeed.length} (Demo + TechHub)`)
            console.log(`   Users: ${targetUsers.length + 1} (Superadmin + Staff)`)
            console.log(`   Products: ${targetProducts.length}`)
            console.log(`   Orders: ${targetOrders.length}`)
            console.log('\n🔐 Login Credentials:')
            console.log('\n   Superadmin:')
            console.log('   Email: superadmin@shopifyadmin.pk')
            console.log('   Password: superadmin123')
            console.log('\n   TechHub Electronics:')
            console.log('   Email: admin@techhub.pk')
            console.log('   Password: admin123')
            console.log('\n   Demo Store:')
            console.log('   Email: demo@shopifyadmin.pk')
            console.log('   Password: demo1234')
            console.log('\n✨ You can now login with the above credentials!\n')

            process.exit(0)
            return
        }

        // Development mode: Full seed with all stores
        console.log('🌱 Development seed mode: Generating full seed data...')
        const multiStoreData = generateMultiStoreData()

        console.log(`📦 Seeding ${multiStoreData.stores.length} stores...`)

        // Seed stores
        await Store.bulkCreate(multiStoreData.stores.map(store => ({
            id: store.id,
            name: store.name,
            dashboardName: store.dashboardName,
            domain: store.domain,
            category: store.category,
            defaultCurrency: store.defaultCurrency || 'PKR',
            country: store.country || 'PK',
            logoUrl: store.logoUrl || null,
            brandColor: store.brandColor || '#1976d2',
            isDemo: store.isDemo || false,
        })))

        console.log(`👥 Seeding ${multiStoreData.users.length} users...`)

        // Seed users
        await User.bulkCreate(multiStoreData.users.map(user => ({
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            name: user.name,
            role: user.role,
            storeId: user.storeId,
            fullName: user.fullName || user.name,
            phone: user.phone || null,
            profilePictureUrl: user.profilePictureUrl || null,
            defaultDateRangeFilter: user.defaultDateRangeFilter || 'last7',
            notificationPreferences: user.notificationPreferences || {
                newOrders: true,
                lowStock: true,
                returnsPending: true,
                returnsPending: true,
            },
            permissions: user.permissions || {},
            active: user.active !== undefined ? user.active : true,
            passwordChangedAt: new Date(), // Set to current date to skip password change requirement
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || user.createdAt || new Date(),
        })))

        // Create superadmin user (skip if already exists)
        console.log('👑 Creating superadmin user...')
        const superAdminExists = await User.findOne({ where: { email: 'superadmin@shopifyadmin.pk' } })
        if (!superAdminExists) {
            const superAdminPassword = bcrypt.hashSync('superadmin123', 10)
            await User.create({
                email: 'superadmin@shopifyadmin.pk',
                passwordHash: superAdminPassword,
                name: 'Super Admin',
                role: 'superadmin',
                storeId: null,
                fullName: 'Super Administrator',
                phone: '+92-300-0000000',
                profilePictureUrl: null,
                defaultDateRangeFilter: 'last7',
                notificationPreferences: {
                    newOrders: true,
                    lowStock: true,
                    returnsPending: true,
                },
                permissions: {
                    viewOrders: true, editOrders: true, deleteOrders: true,
                    viewProducts: true, editProducts: true, deleteProducts: true,
                    viewCustomers: true, editCustomers: true,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: true, manageSettings: true,
                },
                active: true,
                passwordChangedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            console.log('✅ Superadmin user created: superadmin@shopifyadmin.pk / superadmin123')
        } else {
            console.log('ℹ️  Superadmin user already exists, skipping creation')
        }

        console.log(`📦 Seeding ${multiStoreData.products.length} products...`)

        // Seed products
        await Product.bulkCreate(multiStoreData.products.map(product => ({
            id: product.id,
            storeId: product.storeId,
            name: product.name,
            description: product.description || '',
            price: product.price || 0,
            stockQuantity: product.stockQuantity || 0,
            reorderThreshold: product.reorderThreshold || 10,
            category: product.category || 'Uncategorized',
            imageUrl: product.imageUrl || null,
            status: product.status || 'active',
            createdAt: product.createdAt || new Date(),
            updatedAt: product.updatedAt || product.createdAt || new Date(),
        })))

        console.log(`👤 Seeding ${multiStoreData.customers.length} customers...`)

        // Seed customers in batches to avoid packet size limits
        const BATCH_SIZE = 500
        const customerData = multiStoreData.customers.map(customer => ({
            id: customer.id,
            storeId: customer.storeId,
            name: customer.name,
            email: customer.email || null,
            phone: customer.phone || null,
            address: customer.address || null,
            alternativeNames: customer.alternativeNames || [],
            alternativeEmails: customer.alternativeEmails || [],
            alternativePhones: customer.alternativePhones || [],
            alternativeAddresses: customer.alternativeAddresses || [],
            createdAt: customer.createdAt || new Date().toISOString(),
            updatedAt: customer.updatedAt || customer.createdAt || new Date().toISOString(),
        }))

        for (let i = 0; i < customerData.length; i += BATCH_SIZE) {
            const batch = customerData.slice(i, i + BATCH_SIZE)
            await Customer.bulkCreate(batch)
            if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= customerData.length) {
                console.log(`   Processed ${Math.min(i + BATCH_SIZE, customerData.length)}/${customerData.length} customers...`)
            }
        }

        console.log(`📋 Seeding ${multiStoreData.orders.length} orders...`)

        // Seed orders in batches to avoid packet size limits
        const orderData = multiStoreData.orders.map(order => ({
            id: order.id,
            storeId: order.storeId,
            customerId: order.customerId || null,
            orderNumber: order.orderNumber || `ORD-${order.id.substring(0, 8).toUpperCase()}`,
            productName: order.productName,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone || null,
            quantity: order.quantity || 1,
            status: order.status || 'Pending',
            isPaid: order.isPaid !== undefined ? order.isPaid : false,
            total: order.total || 0,
            notes: order.notes || null,
            submittedBy: order.submittedBy || null,
            timeline: order.timeline || [],
            items: order.items || [],
            shippingAddress: order.shippingAddress || null,
            paymentStatus: order.paymentStatus || (order.isPaid ? 'paid' : 'pending'),
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
        }))

        for (let i = 0; i < orderData.length; i += BATCH_SIZE) {
            const batch = orderData.slice(i, i + BATCH_SIZE)
            await Order.bulkCreate(batch)
            if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= orderData.length) {
                console.log(`   Processed ${Math.min(i + BATCH_SIZE, orderData.length)}/${orderData.length} orders...`)
            }
        }

        console.log(`↩️  Seeding ${multiStoreData.returns.length} returns...`)

        // Seed returns
        await Return.bulkCreate(multiStoreData.returns.map(returnItem => ({
            id: returnItem.id,
            storeId: returnItem.storeId,
            orderId: returnItem.orderId,
            customerId: returnItem.customerId || null,
            productId: returnItem.productId || null,
            reason: returnItem.reason,
            returnedQuantity: returnItem.returnedQuantity || returnItem.quantity || 1,
            status: returnItem.status || 'Submitted',
            refundAmount: returnItem.refundAmount || 0,
            history: returnItem.history || [],
            dateRequested: returnItem.dateRequested || returnItem.createdAt || new Date().toISOString(),
            createdAt: returnItem.createdAt || returnItem.dateRequested || new Date().toISOString(),
            updatedAt: returnItem.updatedAt || returnItem.dateRequested || new Date().toISOString(),
        })))

        console.log('⚙️  Seeding settings...')

        // Seed settings
        const settings = multiStoreData.stores.map(store => ({
            id: crypto.randomUUID(),
            storeId: store.id,
            logoUrl: store.logoUrl || null,
            brandColor: store.brandColor || '#1976d2',
            defaultCurrency: store.defaultCurrency || 'PKR',
            country: store.country || 'PK',
            dashboardName: store.dashboardName,
            defaultOrderStatuses: ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'],
        }))
        await Setting.bulkCreate(settings)

        // Print summary
        const finalStoreCount = await Store.count()
        const finalUserCount = await User.count()
        const finalProductCount = await Product.count()
        const finalCustomerCount = await Customer.count()
        const finalOrderCount = await Order.count()
        const finalReturnCount = await Return.count()

        console.log('\n✅ Database reset and seed completed successfully!')
        console.log('\n📊 Summary:')
        console.log(`   Stores: ${finalStoreCount}`)
        console.log(`   Users: ${finalUserCount}`)
        console.log(`   Products: ${finalProductCount}`)
        console.log(`   Customers: ${finalCustomerCount}`)
        console.log(`   Orders: ${finalOrderCount}`)
        console.log(`   Returns: ${finalReturnCount}`)

        // Print login credentials
        console.log('\n🔐 Login Credentials:')
        console.log('\n   Superadmin:')
        console.log('   Email: superadmin@shopifyadmin.pk')
        console.log('   Password: superadmin123')

        console.log('\n   Store Admins (for each store):')
        const stores = await Store.findAll({ order: [['name', 'ASC']] })
        for (const store of stores) {
            const adminUser = await User.findOne({
                where: { storeId: store.id, role: 'admin' },
                attributes: ['email', 'name']
            })
            if (adminUser) {
                console.log(`\n   ${store.name} (${store.domain}):`)
                console.log(`   Admin Email: ${adminUser.email}`)
                console.log(`   Admin Password: admin123`)

                // Find staff users
                const staffUsers = await User.findAll({
                    where: { storeId: store.id, role: 'staff' },
                    attributes: ['email', 'name'],
                    limit: 3
                })
                if (staffUsers.length > 0) {
                    console.log(`   Staff Emails: ${staffUsers.map(u => u.email).join(', ')}`)
                    console.log(`   Staff Password: staff123`)
                }
            }
        }

        // Demo store credentials
        const demoStore = await Store.findOne({ where: { isDemo: true } })
        if (demoStore) {
            const demoUser = await User.findOne({
                where: { storeId: demoStore.id },
                attributes: ['email', 'name']
            })
            if (demoUser) {
                console.log(`\n   Demo Store:`)
                console.log(`   Email: ${demoUser.email}`)
                console.log(`   Password: demo123`)
            }
        }

        console.log('\n📝 See STORE_CREDENTIALS_AND_URLS.md for complete credentials list')
        console.log('\n✨ You can now login with the above credentials!\n')

        process.exit(0)
    } catch (error) {
        console.error('❌ Error resetting and seeding database:', error)
        process.exit(1)
    }
}

// Run if called directly
if (require.main === module) {
    resetAndSeedDatabase()
}

module.exports = { resetAndSeedDatabase }
