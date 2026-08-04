import type { PaymentGatewayPort } from '@modules/payments/domain/ports/payment-gateway.port';
import { Result } from '@shared/result';
import { CheckoutTransaction } from '../../domain/checkout-transaction.entity';
import type { CheckoutRepositoryPort } from '../../domain/ports/checkout-repository.port';
import { ReconcileCheckoutPaymentUseCase } from './reconcile-checkout-payment.use-case';

describe('ReconcileCheckoutPaymentUseCase', () => {
  const pending = new CheckoutTransaction(
    'transaction-1',
    'checkout-1',
    'PENDING',
    'product-1',
    'customer-1',
    'delivery-1',
    1,
    50_000,
    2_500,
    5_000,
    57_500,
    'provider-1',
    'PENDING',
  );

  it('queries the provider and delegates a pending checkout for finalization', async () => {
    const checkoutRepository: jest.Mocked<CheckoutRepositoryPort> = {
      findCustomerByEmail: jest.fn(),
      createCustomer: jest.fn(),
      createDelivery: jest.fn(),
      findTransactionByReference: jest.fn().mockResolvedValue(pending),
      createPendingTransaction: jest.fn(),
      finalizeTransaction: jest.fn(),
    };
    const getPaymentStatus = jest.fn().mockResolvedValue({
      status: 'APPROVED',
      providerReference: 'provider-1',
      providerStatus: 'APPROVED',
    });
    const paymentGateway: jest.Mocked<PaymentGatewayPort> = {
      chargeCard: jest.fn(),
      getPaymentStatus,
    };
    const finalizePayment = jest
      .fn()
      .mockResolvedValue(Result.ok({ ...pending, status: 'APPROVED' }));
    const finalizeCheckoutPayment = { execute: finalizePayment };
    const useCase = new ReconcileCheckoutPaymentUseCase(
      checkoutRepository,
      paymentGateway,
      finalizeCheckoutPayment,
    );

    await useCase.execute('checkout-1');

    expect(getPaymentStatus).toHaveBeenCalledWith('provider-1');
    expect(finalizePayment).toHaveBeenCalledWith('checkout-1', {
      status: 'APPROVED',
      providerReference: 'provider-1',
      providerStatus: 'APPROVED',
    });
  });
});
