const { Category } = require('../models');
const { Op } = require('sequelize');

// Get all categories (Public)
exports.getCategories = async (req, res) => {
    try {
        const { storeId } = req.query;
        const where = { isActive: true };
        if (storeId) where.storeId = storeId;

        const categories = await Category.findAll({
            where,
            order: [['name', 'ASC']]
        });

        res.json(categories);
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

// Get single category by slug (Public)
exports.getCategory = async (req, res) => {
    try {
        const { slug } = req.params;
        const { storeId } = req.query;

        const where = { slug, isActive: true };
        if (storeId) where.storeId = storeId;

        const category = await Category.findOne({ where });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Get Category Error:', error);
        res.status(500).json({ message: 'Error fetching category' });
    }
};

// Create Category (Admin)
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, metaTitle, metaDescription, imageUrl, storeId } = req.body;

        // Use storeId from body (if superadmin) or from req.user
        const targetStoreId = req.storeId || storeId;

        const category = await Category.create({
            storeId: targetStoreId,
            name,
            slug,
            description,
            metaTitle,
            metaDescription,
            imageUrl
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create Category Error:', error);
        res.status(500).json({ message: 'Error creating category' });
    }
};
