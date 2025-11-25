// Global error handler middleware
// Note: Logger and Sentry should be initialized in server.js before this middleware
const NODE_ENV = process.env.NODE_ENV || 'development'

// Detect serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

// Configure transports based on environment
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
]

// Only add file transports in local/development environments
// Serverless environments have read-only filesystems
if (!isServerless && NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  )
}

// We'll require logger from a shared location or pass it as parameter
// For now, create a simple logger here
const winston = require('winston')
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
})

/**
 * Global error handler middleware
 * Must be added after all routes
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log error details
  const errorData = {
    requestId: req.requestId || 'unknown',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status: err.status || err.statusCode || 500,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null,
    storeId: req.storeId || null,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  }

  // Log error
  if (err.status >= 500) {
    logger.error('Server Error', errorData)
  } else {
    logger.warn('Client Error', errorData)
  }

  // Send to Sentry in production for server errors
  // Note: Sentry should be initialized in server.js
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN && err.status >= 500) {
    try {
      const Sentry = require('@sentry/node')
      Sentry.withScope((scope) => {
        scope.setTag('requestId', req.requestId || 'unknown')
        scope.setTag('method', req.method)
        scope.setTag('path', req.path)
        scope.setTag('status', err.status || 500)
        scope.setContext('request', {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body ? (typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 500) : String(req.body).substring(0, 500)) : null,
        })
        if (req.user) {
          scope.setUser({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          })
        }
        Sentry.captureException(err)
      })
    } catch (sentryError) {
      // Sentry not initialized or error sending to Sentry
      logger.error('Failed to send error to Sentry:', sentryError)
    }
  }

  // Determine status code
  const statusCode = err.status || err.statusCode || 500

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? 'An internal server error occurred. Please try again later.'
    : err.message || 'An error occurred'

  // Structured error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      requestId: req.requestId || 'unknown',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details,
      }),
    },
  }

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.error.errors = err.errors
  }

  res.status(statusCode).json(errorResponse)
}

module.exports = { globalErrorHandler }

