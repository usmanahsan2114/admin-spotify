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
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      alternativeEmails: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      alternativePhones: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      alternativeAddresses: {
        type: DataTypes.JSONB,
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

