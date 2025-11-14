'use strict'

module.exports = (sequelize, DataTypes) => {
  const Return = sequelize.define(
    'Return',
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
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'orders',
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
      productId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      returnedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.ENUM('Submitted', 'Approved', 'Rejected', 'Refunded'),
        defaultValue: 'Submitted',
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      history: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      dateRequested: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'returns',
      timestamps: true,
      underscored: false,
    }
  )

  return Return
}

