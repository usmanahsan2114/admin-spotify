const express = require('express')
const router = express.Router()
const returnController = require('../controllers/returnController')
const { validateReturn, validateReturnUpdate } = require('../middleware/validation') // Need to check if these are extracted
const { authenticateToken } = require('../middleware/auth')
const { restrictDemoStore } = require('../middleware/demo')

// Protected
router.get('/returns', authenticateToken, returnController.getReturns)
router.get('/returns/:id', authenticateToken, returnController.getReturnById)
router.post('/returns', authenticateToken, validateReturn, restrictDemoStore, returnController.createReturn) // Apply demo restriction to creation
router.put('/returns/:id', authenticateToken, validateReturnUpdate, restrictDemoStore, returnController.updateReturn) // Apply demo restriction to updates
router.delete('/returns/:id', authenticateToken, restrictDemoStore, returnController.deleteReturn)

module.exports = router
