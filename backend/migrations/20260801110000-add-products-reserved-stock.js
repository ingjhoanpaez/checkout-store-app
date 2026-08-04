'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'reservedStock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addConstraint('products', {
      fields: ['reservedStock'],
      type: 'check',
      name: 'products_reserved_stock_non_negative',
      where: { reservedStock: { [Sequelize.Op.gte]: 0 } },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD CONSTRAINT products_reserved_stock_within_stock
      CHECK ("reservedStock" <= stock)
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'products',
      'products_reserved_stock_within_stock',
    );
    await queryInterface.removeConstraint(
      'products',
      'products_reserved_stock_non_negative',
    );
    await queryInterface.removeColumn('products', 'reservedStock');
  },
};