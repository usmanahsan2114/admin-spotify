'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      alternativeNames: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify([]),
      },
      alternativeEmails: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify([]),
      },
      alternativePhones: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify([]),
      },
      alternativeAddresses: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify([]),
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

    await queryInterface.addIndex('customers', ['storeId'])
    await queryInterface.addIndex('customers', ['email'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customers')
  },
}
