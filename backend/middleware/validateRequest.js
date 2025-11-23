const { z } = require('zod')
const logger = require('../utils/logger')

const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
            cookies: req.cookies,
        })
        next()
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }))

            logger.warn(`[VALIDATION] Validation failed for ${req.originalUrl}:`, formattedErrors)

            return res.status(400).json({
                message: 'Validation failed',
                errors: formattedErrors,
            })
        }
        next(error)
    }
}

module.exports = validateRequest
