'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('organizations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive', 'pending'),
                defaultValue: 'active',
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

        await queryInterface.addColumn('stores', 'organizationId', {
            type: Sequelize.UUID,
            allowNull: true, // Initially nullable to allow migration of existing stores, but we are wiping data anyway
            references: {
                model: 'organizations',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('stores', 'organizationId')
        await queryInterface.dropTable('organizations')
    },
}
