/**
 * Environment variable validation
 * Validates required environment variables at startup
 */
const validateEnvironmentVariables = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development'
  const errors = []

  // Production-specific validations
  if (NODE_ENV === 'production') {
    // Required in production
    const requiredVars = [
      'JWT_SECRET',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
    ]

    requiredVars.forEach((varName) => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`)
      }
    })

    // Validate JWT_SECRET length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production')
    }

    // Validate CORS_ORIGIN is set
    if (!process.env.CORS_ORIGIN) {
      errors.push('CORS_ORIGIN environment variable is required in production')
    }
  }

  // Warn about missing optional but recommended variables
  const warnings = []
  if (!process.env.SENTRY_DSN && NODE_ENV === 'production') {
    warnings.push('SENTRY_DSN not set - error tracking will be disabled')
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    errors.forEach((error) => console.error(`  - ${error}`))
    throw new Error('Environment validation failed. Please check your .env file.')
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:')
    warnings.forEach((warning) => console.warn(`  - ${warning}`))
  }

  console.log('✅ Environment variables validated successfully')
}

module.exports = { validateEnvironmentVariables }

