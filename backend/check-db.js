require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { sequelize, Store } = require('./models')

async function checkDb() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const stores = await Store.findAll()
        console.log(`Found ${stores.length} stores:`)
        stores.forEach(s => console.log(`- ${s.domain} (ID: ${s.id})`))

        const { User } = require('./models')
        const users = await User.count()
        console.log(`Found ${users} users`)

        const superadmin = await User.findOne({ where: { role: 'superadmin' } })
        if (superadmin) {
            console.log('✅ Superadmin found:', superadmin.email)
        } else {
            console.error('❌ Superadmin NOT found')
        }

        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

checkDb()
