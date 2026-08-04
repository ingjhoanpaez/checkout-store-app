import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CustomerModel } from '@infrastructure/database/models/customer.model';
import { DeliveryModel } from '@infrastructure/database/models/delivery.model';
import { TransactionModel } from '@infrastructure/database/models/transaction.model';
import { SequelizeUnitOfWork } from '@infrastructure/database/sequelize-unit-of-work';
import { CheckoutMapper } from '@infrastructure/mappers/checkout.mapper';
import { CheckoutTransactionNotFoundError } from '@modules/transactions/domain/errors/checkout-transaction-not-found.error';
import type {
  CheckoutRepositoryPort,
  CreateCustomerCommand,
  CreateDeliveryCommand,
  CreatePendingTransactionCommand,
} from '@modules/transactions/domain/ports/checkout-repository.port';
import type { PaymentResult } from '@modules/payments/domain/ports/payment-gateway.port';
import type { CheckoutTransaction } from '@modules/transactions/domain/checkout-transaction.entity';
import type { Customer } from '@modules/customers/domain/customer.entity';
import type { Delivery } from '@modules/deliveries/domain/delivery.entity';

@Injectable()
export class CheckoutRepository implements CheckoutRepositoryPort {
  constructor(
    @InjectModel(CustomerModel)
    private readonly customerModel: typeof CustomerModel,
    @InjectModel(DeliveryModel)
    private readonly deliveryModel: typeof DeliveryModel,
    @InjectModel(TransactionModel)
    private readonly transactionModel: typeof TransactionModel,
    private readonly unitOfWork: SequelizeUnitOfWork,
  ) {}

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    const customer = await this.customerModel.findOne({
      where: { email },
      transaction: this.unitOfWork.getCurrentTransaction(),
    });

    return customer ? CheckoutMapper.customerToDomain(customer) : null;
  }

  async createCustomer(command: CreateCustomerCommand): Promise<Customer> {
    const customer = await this.customerModel.create(command, {
      transaction: this.unitOfWork.getCurrentTransaction(),
    });

    return CheckoutMapper.customerToDomain(customer);
  }

  async createDelivery(command: CreateDeliveryCommand): Promise<Delivery> {
    const delivery = await this.deliveryModel.create(command, {
      transaction: this.unitOfWork.getCurrentTransaction(),
    });

    return CheckoutMapper.deliveryToDomain(delivery);
  }

  async findTransactionByReference(
    reference: string,
  ): Promise<CheckoutTransaction | null> {
    const transaction = this.unitOfWork.getCurrentTransaction();
    const checkoutTransaction = await this.transactionModel.findOne({
      where: { reference },
      transaction,
      lock: transaction?.LOCK.UPDATE,
    });

    return checkoutTransaction
      ? CheckoutMapper.transactionToDomain(checkoutTransaction)
      : null;
  }

  async createPendingTransaction(
    command: CreatePendingTransactionCommand,
  ): Promise<CheckoutTransaction> {
    const checkoutTransaction = await this.transactionModel.create(
      {
        ...command,
        status: 'PENDING',
        providerReference: null,
        providerStatus: null,
      },
      { transaction: this.unitOfWork.getCurrentTransaction() },
    );

    return CheckoutMapper.transactionToDomain(checkoutTransaction);
  }

  async finalizeTransaction(
    reference: string,
    payment: PaymentResult,
  ): Promise<CheckoutTransaction> {
    const [updatedCount] = await this.transactionModel.update(
      {
        status: payment.status,
        providerReference: payment.providerReference,
        providerStatus: payment.providerStatus,
      },
      {
        where: { reference, status: 'PENDING' },
        transaction: this.unitOfWork.getCurrentTransaction(),
      },
    );

    if (!updatedCount) {
      throw new CheckoutTransactionNotFoundError(reference);
    }

    const checkoutTransaction = await this.transactionModel.findOne({
      where: { reference },
      transaction: this.unitOfWork.getCurrentTransaction(),
    });

    if (!checkoutTransaction) {
      throw new CheckoutTransactionNotFoundError(reference);
    }

    return CheckoutMapper.transactionToDomain(checkoutTransaction);
  }
}
