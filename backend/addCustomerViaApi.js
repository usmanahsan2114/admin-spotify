require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const jwt = require('jsonwebtoken')
const { User } = require('./db/init').db
const { db } = require('./db/init')
const http = require('http')

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

async function addCustomer() {
    try {
        const user = await User.findOne({ where: { email: 'admin@techhub.pk' } })
        if (!user) {
            console.error('User not found')
            return
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, storeId: user.storeId, type: 'user' },
            JWT_SECRET,
            { expiresIn: '1h' }
        )

        const data = JSON.stringify({
            name: 'API Added Customer',
            email: 'api@added.com',
            phone: '1234567890',
            address: '123 API St',
            storeId: user.storeId
        })

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/customers/',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`)
            res.setEncoding('utf8')
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`)
            })
            res.on('end', () => {
                console.log('No more data in response.')
            })
        })

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`)
        })

        req.write(data)
        req.end()

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.sequelize.close()
    }
}

addCustomer()
