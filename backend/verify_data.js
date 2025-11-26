
require('dotenv').config()
const { db } = require('./db/init')
const { Store, User, Order } = db

async function verifyData() {
    try {
        console.log('🔍 Verifying Database Content...')

        // 1. Find Demo Store
        const demoStore = await Store.findOne({ where: { isDemo: true } })
        if (!demoStore) {
            console.error('❌ Demo Store NOT found!')
            return
        }
        console.log(`✅ Demo Store Found: ${demoStore.name} (${demoStore.id})`)

        // 2. Find Demo User
        const demoUser = await User.findOne({ where: { email: 'demo@shopifyadmin.pk' } })
        if (!demoUser) {
            console.error('❌ Demo User NOT found!')
        } else {
            console.log(`✅ Demo User Found: ${demoUser.email} (StoreId: ${demoUser.storeId})`)
            if (demoUser.storeId !== demoStore.id) {
                console.error('❌ Mismatch: Demo User is linked to a different store!')
            }
        }

        // 3. Count Customers for Demo Store
        const customerCount = await db.Customer.count({ where: { storeId: demoStore.id } })
        console.log(`👥 Total Customers for Demo Store: ${customerCount}`)

        // 4. Count Orders for Demo Store
        const orderCount = await Order.count({ where: { storeId: demoStore.id } })
        console.log(`📊 Total Orders for Demo Store: ${orderCount}`)

        // 5. Check Order Dates
        if (orderCount > 0) {
            const orders = await Order.findAll({
                where: { storeId: demoStore.id },
                order: [['createdAt', 'ASC']],
                limit: 5
            })
            const latestOrders = await Order.findAll({
                where: { storeId: demoStore.id },
                order: [['createdAt', 'DESC']],
                limit: 5
            })

            console.log('📅 Earliest Orders:', orders.map(o => o.createdAt))
            console.log('📅 Latest Orders:', latestOrders.map(o => o.createdAt))
        }

    } catch (error) {
        console.error('❌ Error verifying data:', error)
    } finally {
        process.exit()
    }
}

verifyData()
