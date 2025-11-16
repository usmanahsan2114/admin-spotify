'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      storeId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'stores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      logoUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      brandColor: {
        type: Sequelize.STRING,
        defaultValue: '#1976d2',
      },
      defaultCurrency: {
        type: Sequelize.STRING,
        defaultValue: 'PKR',
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'PK',
      },
      dashboardName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      defaultOrderStatuses: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify(['Pending', 'Paid', 'Accepted', 'Shipped', 'Completed']),
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

    await queryInterface.addIndex('settings', ['storeId'], { unique: true })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('settings')
  },
}
