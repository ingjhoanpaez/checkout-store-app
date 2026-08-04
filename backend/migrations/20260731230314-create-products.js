'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priceInCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
    });

    // Evita stock negativo directamente a nivel de BD, no solo en app.
    await queryInterface.addConstraint('products', {
      fields: ['stock'],
      type: 'check',
      name: 'products_stock_non_negative',
      where: { stock: { [Sequelize.Op.gte]: 0 } },
    });

    await queryInterface.addConstraint('products', {
      fields: ['priceInCents'],
      type: 'check',
      name: 'products_price_non_negative',
      where: { priceInCents: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
