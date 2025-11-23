// Database configuration using environment variables
require('dotenv').config()

// Get database dialect from environment, default to 'mysql' for development
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase()

// Validate dialect is supported
const supportedDialects = ['mysql', 'postgres']
if (!supportedDialects.includes(dialect)) {
  throw new Error(
    `Unsupported DB_DIALECT: ${dialect}. Supported dialects: ${supportedDialects.join(', ')}`
  )
}

// Default ports per dialect
const defaultPorts = {
  mysql: 3306,
  postgres: 5432,
}

// Base configuration
const baseConfig = {
  username: process.env.DB_USER || (dialect === 'mysql' ? 'root' : 'postgres'),
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || (dialect === 'mysql' ? 'shopify_admin_dev' : 'shopify_admin'),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || defaultPorts[dialect], 10),
  dialect,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '5', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
}

// Dialect-specific options
if (dialect === 'postgres') {
  baseConfig.dialectOptions = {
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    } : false,
  }
}

module.exports = {
  development: {
    ...baseConfig,
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
    port: parseInt(process.env.DB_PORT || defaultPorts[dialect], 10),
    dialect,
    logging: false,
    // Postgres-specific options for production
    ...(dialect === 'postgres' ? {
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        } : false,
      },
    } : {}),
  },
}

