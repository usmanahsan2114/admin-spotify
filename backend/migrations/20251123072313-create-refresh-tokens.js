'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      expiresAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      revoked: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      replacedByToken: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })

    // Add index for faster lookups
    await queryInterface.addIndex('refresh_tokens', ['token'])
    await queryInterface.addIndex('refresh_tokens', ['userId'])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('refresh_tokens')
  },
}
