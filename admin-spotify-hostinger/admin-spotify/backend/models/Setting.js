'use strict'

module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define(
    'Setting',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      storeId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'stores',
          key: 'id',
        },
      },
      logoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      brandColor: {
        type: DataTypes.STRING,
        defaultValue: '#1976d2',
      },
      defaultCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'PKR',
      },
      country: {
        type: DataTypes.STRING,
        defaultValue: 'PK',
      },
      dashboardName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      defaultOrderStatuses: {
        type: DataTypes.JSON,
        defaultValue: ['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed'],
      },
    },
    {
      tableName: 'settings',
      timestamps: true,
      underscored: false,
    }
  )

  return Setting
}

