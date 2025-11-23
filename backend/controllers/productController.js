const { Op } = require('sequelize')
const { Product } = require('../db/init').db
const logger = require('../utils/logger')
const { buildStoreWhere } = require('../middleware/auth')
const { detectProductColumns, getMappingSummary, extractRowData } = require('../utils/columnDetector')

// Helper to find product by ID
const findProductById = async (productId) => {
    if (!productId) return null
    return await Product.findByPk(productId)
}

// Public endpoint for products (for test-order page)
const getProductsPublic = async (req, res) => {
    try {
        // Filter by storeId if provided
        const storeId = req.query.storeId

        const where = { status: 'active' }
        if (storeId) {
            where.storeId = storeId
        }

        const productsList = await Product.findAll({
            where,
            order: [['name', 'ASC']],
        })

        // Return only active products with basic info (public access)
        const publicProducts = productsList.map((p) => {
            const productData = p.toJSON ? p.toJSON() : p
            return {
                id: productData.id,
                name: productData.name,
                price: productData.price,
                stockQuantity: productData.stockQuantity,
                category: productData.category,
                imageUrl: productData.imageUrl,
                status: productData.status,
            }
        })

        return res.json(publicProducts)
    } catch (error) {
        logger.error('[ERROR] /api/products/public:', error)
        return res.status(500).json({ message: 'Failed to fetch products', error: error.message })
    }
}

const getProducts = async (req, res) => {
    try {
        const where = buildStoreWhere(req)
        const lowStockOnly = req.query.lowStock === 'true'

        if (lowStockOnly) {
            // Calculate lowStock condition: stockQuantity <= reorderThreshold
            // Use Sequelize.literal for column comparison
            const { Sequelize } = require('sequelize')
            where.stockQuantity = {
                [Op.lte]: Sequelize.col('reorderThreshold')
            }
        }

        // Apply date filtering if provided (filter by createdAt)
        const startDate = req.query.startDate
        const endDate = req.query.endDate

        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)
                where.createdAt[Op.gte] = start
            }
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                where.createdAt[Op.lte] = end
            }
        }

        // Optimize: Fetch only needed fields, calculate lowStock in memory (fast for textual data)
        const productsList = await Product.findAll({
            where,
            order: [['name', 'ASC']],
            attributes: ['id', 'name', 'description', 'price', 'stockQuantity', 'reorderThreshold', 'status', 'category', 'imageUrl', 'createdAt', 'updatedAt', 'storeId'],
        })

        // Calculate lowStock flag for each product (fast operation)
        const productsWithLowStock = productsList.map((p) => {
            const productData = p.toJSON ? p.toJSON() : p
            return {
                ...productData,
                lowStock: productData.stockQuantity <= productData.reorderThreshold,
            }
        })

        return res.json(productsWithLowStock)
    } catch (error) {
        logger.error('Failed to fetch products:', error)
        return res.status(500).json({ message: 'Failed to fetch products', error: error.message })
    }
}

const getLowStockProducts = async (req, res) => {
    try {
        const { Sequelize } = require('sequelize')

        // Build base where clause with store filtering
        const where = buildStoreWhere(req)

        // Add low stock condition
        where.stockQuantity = {
            [Op.lte]: Sequelize.col('reorderThreshold')
        }

        const productsList = await Product.findAll({
            where,
            order: [['name', 'ASC']],
        })

        const lowStockProducts = productsList.map((p) => {
            const productData = p.toJSON ? p.toJSON() : p
            return {
                ...productData,
                lowStock: true,
            }
        })

        return res.json(lowStockProducts)
    } catch (error) {
        logger.error('Failed to fetch low stock products:', error)
        return res.status(500).json({ message: 'Failed to fetch low stock products', error: error.message })
    }
}

const getProductById = async (req, res) => {
    try {
        const product = await findProductById(req.params.id)
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' })
        }

        const productData = product.toJSON ? product.toJSON() : product

        // Verify product belongs to user's store (superadmin can access any store)
        if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Product does not belong to your store.' })
        }

        // Add lowStock flag
        const productWithLowStock = {
            ...productData,
            lowStock: productData.stockQuantity <= productData.reorderThreshold,
        }

        return res.json(productWithLowStock)
    } catch (error) {
        logger.error('Failed to fetch product:', error)
        return res.status(500).json({ message: 'Failed to fetch product', error: error.message })
    }
}

const createProduct = async (req, res) => {
    try {
        const { name, description, price, stockQuantity, reorderThreshold, category, imageUrl, status, storeId } = req.body

        // Superadmin can specify storeId, regular admin uses their store
        const targetStoreId = req.isSuperAdmin && storeId ? storeId : req.storeId
        if (!targetStoreId) {
            return res.status(400).json({ message: 'Store ID is required.' })
        }

        const newProduct = await Product.create({
            storeId: targetStoreId,
            name: String(name).trim(),
            description: description ? String(description).trim() : '',
            price: Number(price),
            stockQuantity: Number(stockQuantity),
            reorderThreshold: Number(reorderThreshold),
            status: status || 'active',
            category: category ? String(category).trim() : undefined,
            imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
        })

        const productData = newProduct.toJSON ? newProduct.toJSON() : newProduct
        const productWithLowStock = {
            ...productData,
            lowStock: productData.stockQuantity <= productData.reorderThreshold,
        }

        return res.status(201).json(productWithLowStock)
    } catch (error) {
        logger.error('Failed to create product:', error)
        return res.status(500).json({ message: 'Failed to create product', error: error.message })
    }
}

const updateProduct = async (req, res) => {
    try {
        const product = await findProductById(req.params.id)
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' })
        }

        const productData = product.toJSON ? product.toJSON() : product

        // Verify product belongs to user's store (superadmin can access any store)
        if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Product does not belong to your store.' })
        }

        const allowedFields = ['name', 'description', 'price', 'stockQuantity', 'reorderThreshold', 'category', 'imageUrl', 'status']
        const updateData = {}
        Object.entries(req.body).forEach(([key, value]) => {
            if (allowedFields.includes(key) && value !== undefined) {
                updateData[key] = value
            }
        })

        // Update product in database
        await product.update(updateData)
        await product.reload()

        const updatedProduct = product.toJSON ? product.toJSON() : product
        const productWithLowStock = {
            ...updatedProduct,
            lowStock: updatedProduct.stockQuantity <= updatedProduct.reorderThreshold,
        }

        return res.json(productWithLowStock)
    } catch (error) {
        logger.error('Failed to update product:', error)
        return res.status(500).json({ message: 'Failed to update product', error: error.message })
    }
}

const deleteProduct = async (req, res) => {
    try {
        const product = await findProductById(req.params.id)
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' })
        }

        const productData = product.toJSON ? product.toJSON() : product

        // Verify product belongs to user's store (superadmin can access any store)
        if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Product does not belong to your store.' })
        }

        await product.destroy()
        return res.status(204).send()
    } catch (error) {
        logger.error('Failed to delete product:', error)
        return res.status(500).json({ message: 'Failed to delete product', error: error.message })
    }
}

const reorderProduct = async (req, res) => {
    try {
        const product = await findProductById(req.params.id)
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' })
        }

        const productData = product.toJSON ? product.toJSON() : product

        // Verify product belongs to user's store (superadmin can access any store)
        if (!req.isSuperAdmin && productData.storeId !== req.storeId) {
            return res.status(403).json({ message: 'Product does not belong to your store.' })
        }

        // Mark as reordered (in a real app, this would update a flag or create a purchase order)
        await product.update({ updatedAt: new Date() })
        await product.reload()

        const updatedProduct = product.toJSON ? product.toJSON() : product
        const productWithLowStock = {
            ...updatedProduct,
            lowStock: updatedProduct.stockQuantity <= updatedProduct.reorderThreshold,
        }

        return res.json(productWithLowStock)
    } catch (error) {
        logger.error('Failed to reorder product:', error)
        return res.status(500).json({ message: 'Failed to reorder product', error: error.message })
    }
}

const exportProducts = async (req, res) => {
    try {
        const headers = [
            'Product ID',
            'Name',
            'Price',
            'Stock Quantity',
            'Reorder Threshold',
            'Low Stock',
            'Status',
            'Category',
            'Updated At',
        ]

        const productsList = await Product.findAll({
            where: buildStoreWhere(req),
            order: [['name', 'ASC']],
        })

        const rows = productsList.map((product) => {
            const pData = product.toJSON ? product.toJSON() : product
            return [
                pData.id,
                pData.name,
                pData.price,
                pData.stockQuantity,
                pData.reorderThreshold,
                (pData.stockQuantity <= pData.reorderThreshold) ? 'Yes' : 'No',
                pData.status,
                pData.category ?? '',
                pData.updatedAt ?? '',
            ]
        })

        // Helper function to send CSV responses (inline for now, or could be imported)
        const sendCsv = (res, filename, headers, rows) => {
            const csvContent = [
                headers.join(','),
                ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
            ].join('\n')

            res.setHeader('Content-Type', 'text/csv')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            return res.send(csvContent)
        }

        return sendCsv(
            res,
            `products_export_${new Date().toISOString().slice(0, 10)}.csv`,
            headers,
            rows,
        )
    } catch (error) {
        logger.error('Failed to export products:', error)
        return res.status(500).json({ message: 'Failed to export products', error: error.message })
    }
}

const importProducts = async (req, res) => {
    try {
        const payload = Array.isArray(req.body)
            ? req.body
            : Array.isArray(req.body?.products)
                ? req.body.products
                : null

        if (!payload || payload.length === 0) {
            return res
                .status(400)
                .json({ message: 'Provide an array of products to import.' })
        }

        // Detect column mappings from headers (first row keys)
        const headers = Object.keys(payload[0])
        const columnMappings = detectProductColumns(headers)
        const mappingSummary = getMappingSummary(columnMappings)

        // Check if all required fields are mapped
        if (mappingSummary.requiredMissing > 0) {
            return res.status(400).json({
                message: 'Unable to detect required columns. Please ensure your CSV has columns for: Product Name and Price.',
                mappingSummary,
                error: 'Missing required column mappings'
            })
        }

        let created = 0
        let updated = 0
        const errors = []

        // Process imports sequentially to avoid race conditions
        for (let index = 0; index < payload.length; index++) {
            const item = payload[index]
            try {
                if (!item || typeof item !== 'object') {
                    throw new Error('Invalid row format.')
                }

                // Extract data using detected column mappings
                const data = extractRowData(item, columnMappings)

                const name = String(data.name ?? '').trim()
                if (!name) {
                    throw new Error('Name is required.')
                }

                const price = Number(data.price ?? 0)
                if (Number.isNaN(price) || price < 0) {
                    throw new Error('Price must be a non-negative number.')
                }

                const stockQuantity = Number(data.stockQuantity ?? 0)
                if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
                    throw new Error('Stock quantity must be a non-negative integer.')
                }

                const reorderThresholdRaw =
                    data.reorderThreshold ?? Math.floor(stockQuantity / 2)
                const reorderThreshold = Number(reorderThresholdRaw)
                if (!Number.isInteger(reorderThreshold) || reorderThreshold < 0) {
                    throw new Error('Reorder threshold must be a non-negative integer.')
                }

                const status =
                    data.status && ['active', 'inactive'].includes(String(data.status).toLowerCase())
                        ? String(data.status).toLowerCase()
                        : 'active'

                let product = null

                // Try to find by SKU first if provided
                if (data.sku) {
                    product = await Product.findOne({
                        where: {
                            sku: String(data.sku),
                            storeId: req.storeId,
                        },
                    })
                }

                // Fall back to finding by name
                if (!product) {
                    product = await Product.findOne({
                        where: {
                            name: { [Op.like]: name },
                            storeId: req.storeId,
                        },
                    })
                }

                if (product) {
                    await product.update({
                        name,
                        price,
                        stockQuantity,
                        reorderThreshold,
                        status,
                        description: data.description ? String(data.description) : (product.description || ''),
                        category: data.category ? String(data.category) : product.category,
                        sku: data.sku ? String(data.sku) : product.sku,
                    })
                    updated += 1
                } else {
                    await Product.create({
                        storeId: req.storeId,
                        name,
                        description: data.description ? String(data.description) : '',
                        price,
                        stockQuantity,
                        reorderThreshold,
                        status,
                        category: data.category ? String(data.category) : undefined,
                        sku: data.sku ? String(data.sku) : undefined,
                    })
                    created += 1
                }
            } catch (error) {
                errors.push({
                    index,
                    message: error instanceof Error ? error.message : 'Unknown error.',
                    row: item,
                })
            }
        }

        return res.json({
            message: `Import complete. Created: ${created}, Updated: ${updated}, Failed: ${errors.length}`,
            created,
            updated,
            failed: errors.length,
            errors,
            mappingSummary
        })
    } catch (error) {
        logger.error('Product import failed:', error)
        return res.status(500).json({
            message: 'Product import failed.',
            error: error instanceof Error ? error.message : 'Unknown error.',
        })
    }
}

module.exports = {
    getProductsPublic,
    getProducts,
    getLowStockProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    reorderProduct,
    exportProducts,
    importProducts,
    findProductById
}
