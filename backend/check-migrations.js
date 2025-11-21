require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { sequelize } = require('./models')

async function checkMigrations() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const [results] = await sequelize.query('SELECT * FROM "SequelizeMeta"')
        console.log('Executed Migrations:')
        results.forEach(r => console.log(`- ${r.name}`))

        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

checkMigrations()
