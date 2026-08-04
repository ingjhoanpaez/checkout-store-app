import { Customer } from '@modules/customers/domain/customer.entity';
import { Delivery } from '@modules/deliveries/domain/delivery.entity';
import type { PaymentGatewayPort } from '@modules/payments/domain/ports/payment-gateway.port';
import type { CheckoutPricingPort } from '../../domain/ports/checkout-pricing.port';
import { Product } from '@modules/products/domain/product.entity';
import type { ProductRepositoryPort } from '@modules/products/domain/ports/product-repository.port';
import { CheckoutTransaction } from '../../domain/checkout-transaction.entity';
import type {
  CheckoutCommand,
  CheckoutRepositoryPort,
} from '../../domain/ports/checkout-repository.port';
import type { UnitOfWorkPort } from '../../domain/ports/unit-of-work.port';
import { CheckoutUseCase } from './checkout.use-case';
import { FinalizeCheckoutPaymentUseCase } from './finalize-checkout-payment.use-case';

describe('CheckoutUseCase', () => {
  const command: CheckoutCommand = {
    reference: 'checkout-1',
    productId: 'product-1',
    quantity: 2,
    customer: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.test',
      phone: '3000000000',
    },
    delivery: {
      recipientName: 'Ada Lovelace',
      phone: '3000000000',
      addressLine1: 'Calle 1',
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'CO',
      postalCode: null,
    },
    card: {
      cardNumber: '4111111111111111',
      cardholderName: 'Ada Lovelace',
      expirationMonth: '12',
      expirationYear: '2030',
      cvv: '123',
    },
  };

  function createTransaction(
    status: CheckoutTransaction['status'],
  ): CheckoutTransaction {
    return new CheckoutTransaction(
      'transaction-1',
      command.reference,
      status,
      command.productId,
      'customer-1',
      'delivery-1',
      command.quantity,
      100_000,
      2_500,
      5_000,
      107_500,
      null,
      null,
    );
  }

  function createDependencies(): {
    productRepository: jest.Mocked<ProductRepositoryPort>;
    checkoutRepository: jest.Mocked<CheckoutRepositoryPort>;
    paymentGateway: jest.Mocked<PaymentGatewayPort>;
    unitOfWork: UnitOfWorkPort;
    chargeCard: jest.MockedFunction<PaymentGatewayPort['chargeCard']>;
    reserveStock: jest.MockedFunction<ProductRepositoryPort['reserveStock']>;
    commitReservedStock: jest.MockedFunction<
      ProductRepositoryPort['commitReservedStock']
    >;
    releaseReservedStock: jest.MockedFunction<
      ProductRepositoryPort['releaseReservedStock']
    >;
    checkoutPricing: CheckoutPricingPort;
  } {
    const chargeCard = jest.fn<PaymentGatewayPort['chargeCard']>();
    const reserveStock = jest.fn<ProductRepositoryPort['reserveStock']>();
    const commitReservedStock =
      jest.fn<ProductRepositoryPort['commitReservedStock']>();
    const releaseReservedStock =
      jest.fn<ProductRepositoryPort['releaseReservedStock']>();

    return {
      productRepository: {
        findById: jest.fn(),
        findAll: jest.fn(),
        reserveStock,
        commitReservedStock,
        releaseReservedStock,
      },
      checkoutRepository: {
        findCustomerByEmail: jest.fn(),
        createCustomer: jest.fn(),
        createDelivery: jest.fn(),
        findTransactionByReference: jest.fn(),
        createPendingTransaction: jest.fn(),
        finalizeTransaction: jest.fn(),
      },
      paymentGateway: { chargeCard },
      unitOfWork: {
        execute: async <T>(work: () => Promise<T>): Promise<T> => work(),
      },
      chargeCard,
      reserveStock,
      commitReservedStock,
      releaseReservedStock,
      checkoutPricing: {
        get: () => ({
          currency: 'COP',
          baseFeeInCents: 2_500,
          deliveryFeeInCents: 5_000,
        }),
      },
    };
  }

  it('persists pending, charges outside the write transaction, and finalizes approved stock', async () => {
    const dependencies = createDependencies();
    const pending = createTransaction('PENDING');
    const approved = createTransaction('APPROVED');
    dependencies.productRepository.findById.mockResolvedValue(
      new Product('product-1', 'Producto', 'Descripción', 50_000, 4),
    );
    dependencies.checkoutRepository.findCustomerByEmail.mockResolvedValue(null);
    dependencies.checkoutRepository.createCustomer.mockResolvedValue(
      new Customer(
        'customer-1',
        'Ada Lovelace',
        'ada@example.test',
        '3000000000',
      ),
    );
    dependencies.checkoutRepository.createDelivery.mockResolvedValue(
      new Delivery(
        'delivery-1',
        'customer-1',
        'Ada Lovelace',
        '3000000000',
        'Calle 1',
        'Bogotá',
        'Cundinamarca',
        'CO',
        null,
      ),
    );
    dependencies.checkoutRepository.createPendingTransaction.mockResolvedValue(
      pending,
    );
    dependencies.checkoutRepository.findTransactionByReference
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pending);
    dependencies.chargeCard.mockResolvedValue({
      status: 'APPROVED',
      providerReference: 'provider-1',
      providerStatus: 'APPROVED',
    });
    dependencies.checkoutRepository.finalizeTransaction.mockResolvedValue(
      approved,
    );
    const finalizer = new FinalizeCheckoutPaymentUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.unitOfWork,
    );
    const useCase = new CheckoutUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.paymentGateway,
      dependencies.unitOfWork,
      dependencies.checkoutPricing,
      finalizer,
    );

    const result = await useCase.execute(command);

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('APPROVED');
    expect(dependencies.chargeCard).toHaveBeenCalledWith(
      expect.objectContaining({ amountInCents: 107_500 }),
    );
    expect(dependencies.reserveStock).toHaveBeenCalledWith('product-1', 2);
    expect(dependencies.commitReservedStock).toHaveBeenCalledWith(
      'product-1',
      2,
    );
  });

  it('returns an already finalized transaction without charging it again', async () => {
    const dependencies = createDependencies();
    const finalized = createTransaction('DECLINED');
    dependencies.checkoutRepository.findTransactionByReference.mockResolvedValue(
      finalized,
    );
    const finalizer = new FinalizeCheckoutPaymentUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.unitOfWork,
    );
    const useCase = new CheckoutUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.paymentGateway,
      dependencies.unitOfWork,
      dependencies.checkoutPricing,
      finalizer,
    );

    const result = await useCase.execute(command);

    expect(result.value).toBe(finalized);
    expect(dependencies.chargeCard).not.toHaveBeenCalled();
    expect(dependencies.reserveStock).not.toHaveBeenCalled();
  });

  it('finalizes a declined payment without decreasing stock', async () => {
    const dependencies = createDependencies();
    const pending = createTransaction('PENDING');
    const declined = createTransaction('DECLINED');
    dependencies.productRepository.findById.mockResolvedValue(
      new Product('product-1', 'Producto', 'Descripción', 50_000, 4),
    );
    dependencies.checkoutRepository.findCustomerByEmail.mockResolvedValue(
      new Customer(
        'customer-1',
        'Ada Lovelace',
        'ada@example.test',
        '3000000000',
      ),
    );
    dependencies.checkoutRepository.createDelivery.mockResolvedValue(
      new Delivery(
        'delivery-1',
        'customer-1',
        'Ada Lovelace',
        '3000000000',
        'Calle 1',
        'Bogotá',
        'Cundinamarca',
        'CO',
        null,
      ),
    );
    dependencies.checkoutRepository.createPendingTransaction.mockResolvedValue(
      pending,
    );
    dependencies.checkoutRepository.findTransactionByReference
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pending);
    dependencies.chargeCard.mockResolvedValue({
      status: 'DECLINED',
      providerReference: 'provider-2',
      providerStatus: 'DECLINED',
    });
    dependencies.checkoutRepository.finalizeTransaction.mockResolvedValue(
      declined,
    );
    const finalizer = new FinalizeCheckoutPaymentUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.unitOfWork,
    );
    const useCase = new CheckoutUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.paymentGateway,
      dependencies.unitOfWork,
      dependencies.checkoutPricing,
      finalizer,
    );

    const result = await useCase.execute(command);

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('DECLINED');
    expect(dependencies.releaseReservedStock).toHaveBeenCalledWith(
      'product-1',
      2,
    );
  });

  it('keeps a pending payment without decreasing stock or charging it again', async () => {
    const dependencies = createDependencies();
    const pending = new CheckoutTransaction(
      'transaction-1',
      command.reference,
      'PENDING',
      command.productId,
      'customer-1',
      'delivery-1',
      command.quantity,
      100_000,
      2_500,
      5_000,
      107_500,
      'provider-3',
      'PENDING',
    );
    dependencies.checkoutRepository.findTransactionByReference.mockResolvedValue(
      pending,
    );
    const finalizer = new FinalizeCheckoutPaymentUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.unitOfWork,
    );
    const useCase = new CheckoutUseCase(
      dependencies.productRepository,
      dependencies.checkoutRepository,
      dependencies.paymentGateway,
      dependencies.unitOfWork,
      dependencies.checkoutPricing,
      finalizer,
    );

    const result = await useCase.execute(command);

    expect(result.value).toBe(pending);
    expect(dependencies.chargeCard).not.toHaveBeenCalled();
    expect(dependencies.commitReservedStock).not.toHaveBeenCalled();
  });
});
