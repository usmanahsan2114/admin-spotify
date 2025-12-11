const jwt = require('jsonwebtoken')
const { User } = require('./db/init').db
const { db } = require('./db/init')
const http = require('http')

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-please-change'

async function testApi() {
    try {
        const user = await User.findOne({ where: { email: { [require('sequelize').Op.like]: '%demo%' } } })
        if (!user) {
            console.error('User not found')
            return
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, storeId: user.storeId, type: 'user' },
            JWT_SECRET,
            { expiresIn: '1h' }
        )

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/customers?limit=100&offset=0',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
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

        req.end()

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.sequelize.close()
    }
}

testApi()
