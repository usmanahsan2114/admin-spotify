require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const fs = require('fs')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { sequelize, Organization, Store, User, Product, Customer, Order, Return, Setting } = require('./models')
const { generateMultiStoreData } = require('./generateMultiStoreData')

async function seedDatabase() {
    try {
        console.log('Connecting to database...')
        await sequelize.authenticate()
        console.log('✅ Connected to database')

        console.log('Generating data (reduced dataset)...')
        const multiStoreData = generateMultiStoreData()

        console.log(`Generated:
    - ${multiStoreData.organizations.length} organizations
    - ${multiStoreData.stores.length} stores
    - ${multiStoreData.users.length} users
    - ${multiStoreData.products.length} products
    - ${multiStoreData.customers.length} customers
    - ${multiStoreData.orders.length} orders
    - ${multiStoreData.returns.length} returns
    `)

        // Clean database
        console.log('Cleaning database...')
        await sequelize.transaction(async (t) => {
            // Disable foreign key checks to allow truncation
            await sequelize.query('SET session_replication_role = "replica";', { transaction: t })

            await Setting.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await Return.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await Order.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await Customer.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await Product.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await User.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await Store.destroy({ where: {}, truncate: true, cascade: true, transaction: t })
            await Organization.destroy({ where: {}, truncate: true, cascade: true, transaction: t })

            // Force storeId to be nullable (fix for failed migration)
            await sequelize.query('ALTER TABLE users ALTER COLUMN "storeId" DROP NOT NULL;', { transaction: t })

            // Re-enable foreign key checks
            await sequelize.query('SET session_replication_role = "origin";', { transaction: t })
        })
        console.log('✅ Database cleaned')

        // Seed Organizations
        console.log('Seeding Organizations...')
        for (const org of multiStoreData.organizations) {
            await Organization.create({
                id: org.id,
                name: org.name,
                status: org.status,
                createdAt: org.createdAt,
                updatedAt: org.updatedAt,
            })
        }
        console.log('✅ Organizations seeded')

        // Seed stores
        console.log('Seeding Stores...')
        const storeDomains = multiStoreData.stores.map(s => s.domain)
        fs.writeFileSync('seed-domains.log', JSON.stringify(storeDomains, null, 2))
        console.log('Store Domains logged to seed-domains.log')

        const uniqueDomains = new Set(storeDomains)
        if (uniqueDomains.size !== storeDomains.length) {
            const errorLog = '❌ Duplicate domains found in generated data!'
            fs.writeFileSync('seed-error.log', errorLog)
            console.error(errorLog)
            process.exit(1)
        }

        try {
            // Insert stores sequentially to debug
            for (const store of multiStoreData.stores) {
                console.log(`Inserting store: ${store.domain}`)
                await Store.create({
                    id: store.id,
                    organizationId: store.organizationId,
                    name: store.name,
                    dashboardName: store.dashboardName,
                    domain: store.domain,
                    category: store.category,
                    defaultCurrency: store.defaultCurrency || 'PKR',
                    country: store.country || 'PK',
                    logoUrl: store.logoUrl || null,
                    brandColor: store.brandColor || '#1976d2',
                    isDemo: store.isDemo || false,
                    createdAt: store.createdAt,
                    updatedAt: store.updatedAt,
                })
                console.log(`✅ Inserted store: ${store.domain}`)
            }
        } catch (storeError) {
            console.error('Error seeding stores:', storeError)
            throw storeError
        }

        // Seed users
        console.log('Seeding Users...')
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
            },
            permissions: user.permissions || {},
            active: user.active !== undefined ? user.active : true,
            passwordChangedAt: new Date(),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        })))

        // Create superadmin user
        console.log('Creating Superadmin...')
        const superAdminPassword = bcrypt.hashSync('superadmin123', 10)
        const superAdminExists = await User.findOne({ where: { email: 'superadmin@shopifyadmin.pk' } })
        if (!superAdminExists) {
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
            console.log('✅ Superadmin created')
        } else {
            console.log('ℹ️ Superadmin already exists')
        }

        // Seed products
        console.log('Seeding Products...')
        // Insert in chunks to avoid memory issues
        const products = multiStoreData.products.map(product => ({
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
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        }))

        for (let i = 0; i < products.length; i += 50) {
            await Product.bulkCreate(products.slice(i, i + 50))
        }

        // Seed customers
        console.log('Seeding Customers...')
        const customers = multiStoreData.customers.map(customer => ({
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
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
        }))

        for (let i = 0; i < customers.length; i += 50) {
            await Customer.bulkCreate(customers.slice(i, i + 50))
        }

        // Seed orders
        console.log('Seeding Orders...')
        const orders = multiStoreData.orders.map(order => ({
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
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }))

        for (let i = 0; i < orders.length; i += 50) {
            await Order.bulkCreate(orders.slice(i, i + 50))
        }

        // Seed returns
        console.log('Seeding Returns...')
        const returns = multiStoreData.returns.map(returnItem => ({
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
            dateRequested: returnItem.dateRequested || returnItem.createdAt || new Date(),
            createdAt: returnItem.createdAt,
            updatedAt: returnItem.updatedAt,
        }))

        for (let i = 0; i < returns.length; i += 50) {
            await Return.bulkCreate(returns.slice(i, i + 50))
        }

        // Seed settings
        console.log('Seeding Settings...')
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

        console.log('✅ Database seeded successfully!')
        process.exit(0)
    } catch (error) {
        const errorLog = `
Error Message: ${error.message}
Stack: ${error.stack}
Validation Errors: ${error.errors ? JSON.stringify(error.errors.map(e => e.message), null, 2) : 'None'}
    `
        fs.writeFileSync('seed-error.log', errorLog)
        console.error('❌ Seeding failed. Check seed-error.log')
        process.exit(1)
    }
}

seedDatabase()
