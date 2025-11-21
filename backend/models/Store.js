'use strict'

module.exports = (sequelize, DataTypes) => {
  const Store = sequelize.define(
    'Store',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true, // Initially nullable
        references: {
          model: 'organizations',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dashboardName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      defaultCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'PKR',
      },
      country: {
        type: DataTypes.STRING,
        defaultValue: 'PK',
      },
      logoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      brandColor: {
        type: DataTypes.STRING,
        defaultValue: '#1976d2',
      },
      isDemo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'stores',
      timestamps: true,
      underscored: false,
    }
  )

  return Store
}

