'use strict'

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
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
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Accepted', 'Shipped', 'Refunded', 'Completed', 'Cancelled'),
        defaultValue: 'Pending',
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submittedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      timeline: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      items: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      shippingAddress: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded'),
        defaultValue: 'pending',
      },
      paymentMethod: {
        type: DataTypes.STRING,
        defaultValue: 'Card',
        allowNull: true,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      underscored: false,
    }
  )

  return Order
}

