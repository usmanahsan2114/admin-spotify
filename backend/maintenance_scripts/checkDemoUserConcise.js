const { User } = require('./db/init').db
const { db } = require('./db/init')
const { Op } = require('sequelize')

async function checkDemo() {
    try {
        const user = await User.findOne({
            where: {
                email: { [Op.like]: '%demo%' }
            }
        })

        if (user) {
            console.log('Demo User ID:', user.id)
            console.log('Demo User Role:', user.role)
            console.log('Demo User StoreID:', user.storeId)
        } else {
            console.log('No demo user found')
        }
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.sequelize.close()
    }
}

checkDemo()
