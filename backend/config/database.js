// Database configuration using environment variables
require('dotenv').config()

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopify_admin_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  production: {
    username: process.env.DB_USER || (() => {
      throw new Error('DB_USER environment variable is required in production')
    })(),
    password: process.env.DB_PASSWORD || (() => {
      throw new Error('DB_PASSWORD environment variable is required in production')
    })(),
    database: process.env.DB_NAME || (() => {
      throw new Error('DB_NAME environment variable is required in production')
    })(),
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  },
}

