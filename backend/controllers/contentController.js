const { Page, BlogPost, Store } = require('../models');

// Get Page by Slug
exports.getPage = async (req, res) => {
    try {
        const { slug } = req.params;
        const { storeId } = req.query; // Optional, or infer from domain/header

        const where = { slug, isPublished: true };
        if (storeId) where.storeId = storeId;

        // If no storeId provided, we might get ambiguous results if multiple stores have same slug.
        // For MVP, we'll just return the first one or require storeId.
        // Let's assume storeId is passed or we default to a primary store.

        const page = await Page.findOne({ where });

        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        console.error('Get Page Error:', error);
        res.status(500).json({ message: 'Error fetching page' });
    }
};

// Get Blog Posts (List)
exports.getBlogPosts = async (req, res) => {
    try {
        const { storeId, limit = 10, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        const where = { isPublished: true };
        if (storeId) where.storeId = storeId;

        const { count, rows } = await BlogPost.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['publishedAt', 'DESC']]
        });

        res.json({
            posts: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Get Blog Posts Error:', error);
        res.status(500).json({ message: 'Error fetching blog posts' });
    }
};

// Get Blog Post by Slug
exports.getBlogPost = async (req, res) => {
    try {
        const { slug } = req.params;
        const { storeId } = req.query;

        const where = { slug, isPublished: true };
        if (storeId) where.storeId = storeId;

        const post = await BlogPost.findOne({ where });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Get Blog Post Error:', error);
        res.status(500).json({ message: 'Error fetching blog post' });
    }
};
