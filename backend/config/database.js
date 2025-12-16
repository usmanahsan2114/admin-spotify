// Database configuration using environment variables
// Used by Sequelize CLI for migrations
require('dotenv').config()

// Helper function to parse DATABASE_URL if present
function getDatabaseConfig(environment) {
  // Priority 1: Use DATABASE_URL if present (Supabase integration, Heroku, etc.)
  if (process.env.DATABASE_URL) {
    const config = {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      logging: environment === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Supabase and most cloud providers
        },
        // Disable prepared statements for Supabase Transaction Pooler (Port 6543)
        // This is required because transaction poolers don't support prepared statements
        prependSearchPath: true,
      },
      dialectModule: require('pg'),
    }

    // Add pool configuration
    if (environment === 'production') {
      config.pool = {
        max: parseInt(process.env.DB_POOL_MAX || '5', 10),
        min: parseInt(process.env.DB_POOL_MIN || '0', 10),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      }
    }

    return config
  }

  // Priority 2: Use individual environment variables (existing behavior)
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

  const config = {
    username: process.env.DB_USER || (dialect === 'mysql' ? 'root' : 'postgres'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || (dialect === 'mysql' ? 'shopify_admin_dev' : 'shopify_admin'),
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || defaultPorts[dialect], 10),
    dialect,
    logging: environment === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
  }

  // Dialect-specific options
  if (dialect === 'postgres') {
    config.dialectOptions = {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      } : false,
    }
    config.dialectModule = require('pg')
  }

  // Production validation
  if (environment === 'production') {
    if (!process.env.DB_USER) throw new Error('DB_USER environment variable is required in production')
    if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD environment variable is required in production')
    if (!process.env.DB_NAME) throw new Error('DB_NAME environment variable is required in production')
  }

  return config
}

module.exports = {
  development: getDatabaseConfig('development'),
  production: getDatabaseConfig('production'),
}


