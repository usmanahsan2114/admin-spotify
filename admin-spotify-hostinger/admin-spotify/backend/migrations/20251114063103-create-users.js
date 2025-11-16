'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('admin', 'staff'),
        defaultValue: 'staff',
      },
      storeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      profilePictureUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      defaultDateRangeFilter: {
        type: Sequelize.STRING,
        defaultValue: 'last7',
      },
      notificationPreferences: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify({
          newOrders: true,
          lowStock: true,
          returnsPending: true,
        }),
      },
      permissions: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify({}),
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      passwordChangedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    })

    await queryInterface.addIndex('users', ['storeId'])
    await queryInterface.addIndex('users', ['email'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users')
  },
}
