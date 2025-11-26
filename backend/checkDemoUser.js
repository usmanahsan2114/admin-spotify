const { User } = require('./db/init').db
const { db } = require('./db/init')

async function checkDemo() {
    try {
        // Assuming demo user email is 'demo@example.com' or similar. 
        // I'll search for a user with role 'demo' or email containing 'demo'
        const users = await User.findAll({
            where: {
                email: { [require('sequelize').Op.like]: '%demo%' }
            }
        })

        if (users.length > 0) {
            users.forEach(u => console.log('Demo User:', JSON.stringify(u.toJSON(), null, 2)))
        } else {
            console.log('No demo user found')
        }
    } catch (error) {
        console.error('Error checking demo user:', error)
    } finally {
        await db.sequelize.close()
    }
}

checkDemo()
