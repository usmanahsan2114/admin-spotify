module.exports = (sequelize, DataTypes) => {
    const Page = sequelize.define('Page', {
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
            type: DataTypes.TEXT, // HTML or Markdown
            allowNull: true
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        tableName: 'pages',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['storeId', 'slug']
            }
        ]
    });

    return Page;
};
