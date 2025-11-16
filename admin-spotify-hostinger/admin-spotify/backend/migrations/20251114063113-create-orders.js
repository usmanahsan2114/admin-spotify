'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
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
      customerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      orderNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customerName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Accepted', 'Paid', 'Shipped', 'Refunded', 'Completed', 'Cancelled'),
        defaultValue: 'Pending',
      },
      isPaid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      submittedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      timeline: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify([]),
      },
      items: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify([]),
      },
      shippingAddress: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'paid', 'refunded'),
        defaultValue: 'pending',
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

    await queryInterface.addIndex('orders', ['storeId'])
    await queryInterface.addIndex('orders', ['customerId'])
    await queryInterface.addIndex('orders', ['orderNumber'])
    await queryInterface.addIndex('orders', ['status'])
    await queryInterface.addIndex('orders', ['createdAt'])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders')
  },
}
