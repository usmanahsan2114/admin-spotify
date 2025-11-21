'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('orders', 'paymentMethod', {
            type: Sequelize.STRING,
            defaultValue: 'Card',
            allowNull: true,
        })
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('orders', 'paymentMethod')
    }
};
