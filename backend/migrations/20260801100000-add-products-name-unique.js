'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('products', {
      fields: ['name'],
      type: 'unique',
      name: 'products_name_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('products', 'products_name_unique');
  },
};