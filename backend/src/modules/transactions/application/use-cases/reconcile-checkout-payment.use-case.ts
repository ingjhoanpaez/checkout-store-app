import type { PaymentGatewayPort } from '@modules/payments/domain/ports/payment-gateway.port';
import { Result } from '@shared/result';
import { normalizeError } from '@shared/normalize-error';
import type { CheckoutTransaction } from '../../domain/checkout-transaction.entity';
import { CheckoutTransactionNotFoundError } from '../../domain/errors/checkout-transaction-not-found.error';
import type { CheckoutRepositoryPort } from '../../domain/ports/checkout-repository.port';
import type { FinalizeCheckoutPaymentUseCase } from './finalize-checkout-payment.use-case';

export class ReconcileCheckoutPaymentUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly finalizeCheckoutPayment: FinalizeCheckoutPaymentUseCase,
  ) {}

  async execute(
    reference: string,
  ): Promise<
    Result<CheckoutTransaction, CheckoutTransactionNotFoundError | Error>
  > {
    const checkout =
      await this.checkoutRepository.findTransactionByReference(reference);

    if (!checkout) {
      return Result.fail(new CheckoutTransactionNotFoundError(reference));
    }

    if (!checkout.isPending() || !checkout.providerReference) {
      return Result.ok(checkout);
    }

    try {
      const payment = await this.paymentGateway.getPaymentStatus(
        checkout.providerReference,
      );
      // finalizeCheckoutPayment ya retorna Result: se encadena directo.
      return this.finalizeCheckoutPayment.execute(reference, payment);
    } catch (error) {
      return Result.fail(normalizeError(error));
    }
  }
}
