const { Product, Store, Category } = require('../models');
const { Op } = require('sequelize');

// Get all products (public)
// Supports pagination, filtering by category, price range, and sorting
exports.getPublicProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            minPrice,
            maxPrice,
            sort = 'newest',
            search,
            storeId // Optional: filter by specific store if needed, otherwise returns all or requires subdomain logic
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { status: 'active' }; // Only show active products

        // Filter by Store (if provided, otherwise might need to infer from domain or return all)
        // For a multi-tenant system, we usually want to filter by store.
        // If storeId is not provided, we might want to return 400 or default to a demo store.
        // For now, let's make storeId optional but recommended.
        if (storeId) {
            where.storeId = storeId;
        }

        // Filter by Category
        if (category) {
            where.category = category;
        }

        // Filter by Price
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
        }

        // Search
        if (search) {
            where.name = { [Op.iLike]: `%${search}%` };
        }

        // Sorting
        let order = [['createdAt', 'DESC']];
        if (sort === 'price_asc') order = [['price', 'ASC']];
        if (sort === 'price_desc') order = [['price', 'DESC']];
        if (sort === 'name_asc') order = [['name', 'ASC']];
        if (sort === 'name_desc') order = [['name', 'DESC']];

        const { count, rows } = await Product.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order,
            attributes: [
                'id', 'name', 'description', 'price', 'category',
                'imageUrl', 'stockQuantity', 'storeId', 'createdAt'
            ] // Exclude costPrice, supplier, etc.
        });

        res.json({
            products: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching public products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
    // Get single product by ID (public)
    exports.getPublicProductById = async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findOne({
                where: { id, status: 'active' },
                attributes: [
                    'id', 'name', 'description', 'price', 'category',
                    'imageUrl', 'stockQuantity', 'storeId', 'createdAt'
                ]
            });

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            res.json(product);
        } catch (error) {
            console.error('Error fetching public product:', error);
            res.status(500).json({ message: 'Error fetching product', error: error.message });
        }
    };

    // Get all categories (public)
    exports.getPublicCategories = async (req, res) => {
        try {
            const { storeId } = req.query;
            const where = { status: 'active' };
            if (storeId) where.storeId = storeId;

            // Get unique categories
            const categories = await Product.findAll({
                where,
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
                order: [['category', 'ASC']]
            });

            res.json(categories.map(c => c.category));
        } catch (error) {
            // Fallback if DISTINCT fails or complex query needed
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Error fetching categories', error: error.message });
        }
    };
