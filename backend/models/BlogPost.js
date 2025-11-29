module.exports = (sequelize, DataTypes) => {
    const BlogPost = sequelize.define('BlogPost', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        storeId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        excerpt: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        author: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        tags: {
            type: DataTypes.STRING, // Comma separated or JSON
            allowNull: true
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        metaTitle: {
            type: DataTypes.STRING,
            allowNull: true
        },
        metaDescription: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'blog_posts',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['storeId', 'slug']
            }
        ]
    });

    return BlogPost;
};
