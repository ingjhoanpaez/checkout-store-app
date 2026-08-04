'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('products', [
      {
        id: randomUUID(),
        name: 'Producto demo',
        description: 'Producto de prueba para el flujo de checkout con tarjeta de crédito.',
        priceInCents: 5000000, // $50.000 COP
        stock: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
