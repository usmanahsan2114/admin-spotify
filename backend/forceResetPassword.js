const { User } = require('./db/init').db
const { db } = require('./db/init')
const bcrypt = require('bcryptjs')

async function resetPass() {
    try {
        const user = await User.findOne({ where: { email: 'admin@techhub.pk' } })
        if (!user) {
            console.log('User not found')
            return
        }

        const newHash = await bcrypt.hash('admin123', 10)
        console.log('Old Hash:', user.passwordHash)
        console.log('New Hash:', newHash)

        user.passwordHash = newHash
        await user.save()

        console.log('Password updated successfully.')

        // Verify immediately
        const isMatch = await bcrypt.compare('admin123', newHash)
        console.log('Immediate Verification:', isMatch)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.sequelize.close()
    }
}

resetPass()
