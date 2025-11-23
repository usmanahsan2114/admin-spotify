const express = require('express')
const router = express.Router()
const returnController = require('../controllers/returnController')
const validateRequest = require('../middleware/validateRequest')
const { createReturnSchema, updateReturnSchema } = require('../middleware/validationSchemas')
const { authenticateToken } = require('../middleware/auth')
const { restrictDemoStore } = require('../middleware/demo')

// Protected
router.get('/returns', authenticateToken, returnController.getReturns)
router.get('/returns/:id', authenticateToken, returnController.getReturnById)
router.post('/returns', authenticateToken, validateRequest(createReturnSchema), restrictDemoStore, returnController.createReturn) // Apply demo restriction to creation
router.put('/returns/:id', authenticateToken, validateRequest(updateReturnSchema), restrictDemoStore, returnController.updateReturn) // Apply demo restriction to updates
router.delete('/returns/:id', authenticateToken, restrictDemoStore, returnController.deleteReturn)

module.exports = router
