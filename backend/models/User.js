'use strict'

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'staff'),
        defaultValue: 'staff',
      },
      storeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profilePictureUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      defaultDateRangeFilter: {
        type: DataTypes.STRING,
        defaultValue: 'last7',
      },
      notificationPreferences: {
        type: DataTypes.JSON,
        defaultValue: {
          newOrders: true,
          lowStock: true,
          returnsPending: true,
        },
      },
      permissions: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      passwordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: false,
    }
  )

  return User
}

