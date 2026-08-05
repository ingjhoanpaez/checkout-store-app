'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('products', [
      {
        id: randomUUID(),
        name: 'Audífonos inalámbricos',
        description: 'Audífonos bluetooth con cancelación de ruido, batería de 20 horas.',
        priceInCents: 12900000, // $129.000 COP
        stock: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Mochila urbana',
        description: 'Mochila resistente al agua con compartimento acolchado para laptop.',
        priceInCents: 8500000, // $85.000 COP
        stock: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Termo acero inoxidable',
        description: 'Termo de 750ml, mantiene la temperatura hasta 12 horas.',
        priceInCents: 3200000, // $32.000 COP
        stock: 3, // stock bajo a propósito: sirve para probar el caso "sin stock"
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', {
      name: ['Audífonos inalámbricos', 'Mochila urbana', 'Termo acero inoxidable'],
    });
  },
};
