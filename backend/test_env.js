
const path = require('path')
const dotenv = require('dotenv')

// Explicitly load from .env in current directory
const result = dotenv.config({ path: path.resolve(__dirname, '.env') })

console.log('Dotenv Result:', result.error ? result.error.message : 'Success')
console.log('Parsed:', result.parsed)

console.log('--- Process Env ---')
console.log('DB_DIALECT:', process.env.DB_DIALECT)
console.log('DB_HOST:', process.env.DB_HOST)
console.log('Current Directory:', process.cwd())
