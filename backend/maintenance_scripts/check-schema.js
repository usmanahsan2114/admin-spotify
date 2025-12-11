require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const { sequelize } = require('./models')

async function checkSchema() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const [results] = await sequelize.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'storeId'
        `)
        console.log('Users Table storeId Column:')
        results.forEach(r => console.log(`- ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable})`))

        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

checkSchema()
