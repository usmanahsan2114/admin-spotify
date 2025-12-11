const { User } = require('./db/init').db
const { db } = require('./db/init')
const bcrypt = require('bcryptjs')

async function checkPass() {
    try {
        const user = await User.findOne({ where: { email: 'admin@techhub.pk' } })
        if (!user) {
            console.log('User not found')
            return
        }

        console.log('User found:', user.email)
        console.log('Stored Hash:', user.passwordHash)

        const isMatch = await bcrypt.compare('password123', user.passwordHash)
        console.log('Password Match (password123):', isMatch)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.sequelize.close()
    }
}

checkPass()
