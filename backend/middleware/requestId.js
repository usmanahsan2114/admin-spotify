const crypto = require('crypto')

// Simple UUID v4 generator (no external dependency needed)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Request ID middleware
 * Adds a unique request ID to each request for logging correlation
 */
const requestIdMiddleware = (req, res, next) => {
  // Generate or use existing request ID
  req.requestId = req.headers['x-request-id'] || generateUUID()
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId)
  
  next()
}

module.exports = { requestIdMiddleware }

