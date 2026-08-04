'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
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

    await queryInterface.createTable('deliveries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      recipientName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      addressLine1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      postalCode: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'PENDING',
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      deliveryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'deliveries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      productAmountInCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      baseFeeInCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deliveryFeeInCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalAmountInCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      providerReference: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      providerStatus: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addConstraint('transactions', {
      fields: ['status'],
      type: 'check',
      name: 'transactions_valid_status',
      where: { status: ['PENDING', 'APPROVED', 'DECLINED', 'FAILED'] },
    });

    await queryInterface.addConstraint('transactions', {
      fields: ['quantity'],
      type: 'check',
      name: 'transactions_positive_quantity',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
    });

    for (const field of [
      'productAmountInCents',
      'baseFeeInCents',
      'deliveryFeeInCents',
      'totalAmountInCents',
    ]) {
      await queryInterface.addConstraint('transactions', {
        fields: [field],
        type: 'check',
        name: `transactions_${field}_non_negative`,
        where: { [field]: { [Sequelize.Op.gte]: 0 } },
      });
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE transactions
      ADD CONSTRAINT transactions_total_matches_components
      CHECK (
        "totalAmountInCents" = "productAmountInCents"
          + "baseFeeInCents"
          + "deliveryFeeInCents"
      )
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('deliveries');
    await queryInterface.dropTable('customers');
  },
};