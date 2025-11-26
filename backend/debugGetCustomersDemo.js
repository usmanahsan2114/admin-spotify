const customerController = require('./controllers/customerController')
const { User } = require('./db/init').db
const { db } = require('./db/init')
const { Op } = require('sequelize')

async function debug() {
    try {
        const user = await User.findOne({
            where: {
                email: { [Op.like]: '%demo%' }
            }
        })

        if (!user) {
            console.error('Demo user not found')
            return
        }

        console.log('Testing with user:', user.email)

        const req = {
            user: user.toJSON(),
            storeId: user.storeId,
            isSuperAdmin: user.role === 'superadmin',
            query: {
                limit: '10',
                offset: '0',
                search: 'Test'
            }
        }

        const res = {
            json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
            status: (code) => {
                console.log('Response Status:', code)
                return {
                    json: (data) => console.log('Error JSON:', JSON.stringify(data, null, 2))
                }
            }
        }

        console.log('Calling getCustomers...')
        await customerController.getCustomers(req, res)

    } catch (error) {
        console.error('Unexpected error:', error)
    } finally {
        await db.sequelize.close()
    }
}

debug()
