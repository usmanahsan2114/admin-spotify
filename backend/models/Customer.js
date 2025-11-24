'use strict'

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    'Customer',
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
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      alternativeNames: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      alternativeEmails: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      alternativePhones: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      alternativeAddresses: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
    },
    {
      tableName: 'customers',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['storeId'],
        },
        {
          fields: ['email'],
        },
      ],
    }
  )

  return Customer
}

