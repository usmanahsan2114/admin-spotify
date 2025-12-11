const { User, Store } = require('./db/init').db
const { db } = require('./db/init')
const bcrypt = require('bcryptjs')

async function ensureAdmin() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10)

        // Ensure default store exists
        let store = await Store.findOne({ where: { name: 'Default Store' } })
        if (!store) {
            store = await Store.create({ name: 'Default Store', domain: 'localhost' })
            console.log('Default Store created')
        }

        const [user, created] = await User.findOrCreate({
            where: { email: 'admin@admin.com' },
            defaults: {
                name: 'Admin User',
                passwordHash,
                role: 'admin',
                storeId: store.id
            }
        })

        if (!created) {
            user.passwordHash = passwordHash
            user.role = 'admin'
            user.storeId = store.id
            await user.save()
            console.log('Admin user updated')
        } else {
            console.log('Admin user created')
        }
    } catch (error) {
        console.error('Error ensuring admin:', error)
    } finally {
        await db.sequelize.close()
    }
}

ensureAdmin()
