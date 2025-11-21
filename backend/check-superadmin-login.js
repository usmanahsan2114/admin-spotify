require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const bcrypt = require('bcryptjs')
const { sequelize, User } = require('./models')

async function checkSuperadmin() {
    try {
        await sequelize.authenticate()
        console.log('✅ Connected to database')

        const email = 'superadmin@shopifyadmin.pk'
        const password = 'superadmin123'

        const user = await User.findOne({ where: { email } })

        if (!user) {
            console.error('❌ Superadmin user NOT found')
            process.exit(1)
        }

        console.log(`✅ User found: ${user.email} (ID: ${user.id})`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Active: ${user.active}`)
        console.log(`   StoreId: ${user.storeId}`)

        const isMatch = bcrypt.compareSync(password, user.passwordHash)
        if (isMatch) {
            console.log('✅ Password match: SUCCESS')
        } else {
            console.error('❌ Password match: FAILED')
            console.log('   Hash in DB:', user.passwordHash)
            console.log('   New Hash:', bcrypt.hashSync(password, 10))
        }

        process.exit(0)
    } catch (error) {
        console.error('Check failed:', error)
        process.exit(1)
    }
}

checkSuperadmin()
