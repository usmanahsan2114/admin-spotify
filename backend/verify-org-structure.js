require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { sequelize, Organization, Store, User } = require('./models')

async function verifyStructure() {
    try {
        await sequelize.authenticate()
        console.log('✅ Connected to database')

        // Check Organizations
        const orgs = await Organization.findAll({ include: ['stores'] })
        console.log(`\nOrganizations found: ${orgs.length}`)
        orgs.forEach(org => {
            console.log(`- Org: ${org.name} (ID: ${org.id})`)
            console.log(`  Stores: ${org.stores.length}`)
            org.stores.forEach(store => {
                console.log(`    - Store: ${store.name} (Domain: ${store.domain})`)
            })
        })

        if (orgs.length !== 2) {
            console.error('❌ Expected 2 organizations, found ' + orgs.length)
        }

        // Check Stores
        const stores = await Store.findAll()
        console.log(`\nTotal Stores: ${stores.length}`)
        if (stores.length !== 2) {
            console.error('❌ Expected 2 stores, found ' + stores.length)
        }

        // Check Superadmin
        const superadmin = await User.findOne({ where: { role: 'superadmin' } })
        if (superadmin) {
            console.log(`\n✅ Superadmin found: ${superadmin.email}`)
        } else {
            console.error('\n❌ Superadmin NOT found')
        }

        process.exit(0)
    } catch (error) {
        console.error('Verification failed:', error)
        process.exit(1)
    }
}

verifyStructure()
