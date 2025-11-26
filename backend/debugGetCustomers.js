const customerController = require('./controllers/customerController')
const { User } = require('./db/init').db
const { db } = require('./db/init')

async function debug() {
    try {
        // Find admin user to get valid storeId
        const user = await User.findOne({ where: { email: 'admin@techhub.pk' } })
        if (!user) {
            console.error('Admin user not found')
            return
        }

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
