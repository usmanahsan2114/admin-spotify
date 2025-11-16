'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change role ENUM to include 'superadmin'
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'staff', 'superadmin') 
      NOT NULL DEFAULT 'staff'
    `)
    
    // Make storeId nullable for superadmin users
    await queryInterface.changeColumn('users', 'storeId', {
      type: Sequelize.UUID,
      allowNull: true, // Allow null for superadmin
      references: {
        model: 'stores',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    
    // Add index for superadmin queries
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role',
      using: 'BTREE',
    })
  },

  async down(queryInterface, Sequelize) {
    // Remove superadmin users first (they have null storeId)
    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE role = 'superadmin'
    `)
    
    // Revert role ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'staff') 
      NOT NULL DEFAULT 'staff'
    `)
    
    // Make storeId required again
    await queryInterface.changeColumn('users', 'storeId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'stores',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    })
    
    // Remove index
    await queryInterface.removeIndex('users', 'idx_users_role')
  },
}

