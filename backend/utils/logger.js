const winston = require('winston')

const NODE_ENV = process.env.NODE_ENV || 'development'

// Simple console-only logger (Vercel-compatible)
// Vercel captures console output in Runtime Logs
const logger = winston.createLogger({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'shopify-admin-api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
})

module.exports = logger

