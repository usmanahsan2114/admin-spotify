'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableName = 'customers';
    const columns = ['alternativeNames', 'alternativeEmails', 'alternativePhones', 'alternativeAddresses'];

    for (const col of columns) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${tableName}" ALTER COLUMN "${col}" TYPE jsonb USING "${col}"::jsonb;`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableName = 'customers';
    const columns = ['alternativeNames', 'alternativeEmails', 'alternativePhones', 'alternativeAddresses'];

    for (const col of columns) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${tableName}" ALTER COLUMN "${col}" TYPE json USING "${col}"::json;`
      );
    }
  }
};
