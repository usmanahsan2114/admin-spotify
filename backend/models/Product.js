'use strict'

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      storeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      reorderThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      category: {
        type: DataTypes.STRING,
        defaultValue: 'Uncategorized',
      },
      imageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      metaTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metaDescription: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'products',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['storeId'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['category'],
        },
      ],
      hooks: {
        afterFind: (products) => {
          if (!products) return
          const productArray = Array.isArray(products) ? products : [products]
          productArray.forEach((product) => {
            if (product) {
              product.dataValues.lowStock = product.stockQuantity <= product.reorderThreshold
            }
          })
        },
      },
    }
  )

  return Product
}

