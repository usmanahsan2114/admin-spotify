'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect()

    // Change role ENUM to include 'superadmin'
    // Use dialect-agnostic approach
    if (dialect === 'mysql') {
      // MySQL-specific syntax
      await queryInterface.sequelize.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('admin', 'staff', 'superadmin') 
        NOT NULL DEFAULT 'staff'
      `)
    } else if (dialect === 'postgres') {
      // Postgres-specific syntax: add value to existing ENUM type
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'superadmin';
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)
    } else {
      // Fallback: use Sequelize's changeColumn (works for both dialects)
      await queryInterface.changeColumn('users', 'role', {
        type: Sequelize.ENUM('admin', 'staff', 'superadmin'),
        allowNull: false,
        defaultValue: 'staff',
      })
    }
    
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
    // Use dialect-agnostic index creation
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role',
      // Don't specify 'using: BTREE' for Postgres (default is btree)
      ...(dialect === 'mysql' ? { using: 'BTREE' } : {}),
    })
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect()

    // Remove superadmin users first (they have null storeId)
    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE role = 'superadmin'
    `)
    
    // Revert role ENUM (Note: Postgres doesn't support removing ENUM values easily)
    // This is a limitation - we'll use changeColumn for both dialects
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'staff'),
      allowNull: false,
      defaultValue: 'staff',
    })
    
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

