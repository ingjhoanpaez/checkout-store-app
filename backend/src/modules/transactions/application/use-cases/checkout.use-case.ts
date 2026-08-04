import type { PaymentGatewayPort } from '@modules/payments/domain/ports/payment-gateway.port';
import type { ProductRepositoryPort } from '@modules/products/domain/ports/product-repository.port';
import { ProductNotFoundError } from '@modules/products/domain/errors/product-not-found.error';
import { ProductOutOfStockError } from '@modules/products/domain/errors/product-out-of-stock.error';
import { PaymentGatewayNotConfiguredError } from '@modules/payments/domain/errors/payment-gateway-not-configured.error';
import { PaymentProviderError } from '@modules/payments/domain/errors/payment-provider-error';
import { Result } from '@shared/result';
import { normalizeError } from '@shared/normalize-error';
import type { CheckoutTransaction } from '../../domain/checkout-transaction.entity';
import type {
  CheckoutCommand,
  CheckoutRepositoryPort,
} from '../../domain/ports/checkout-repository.port';
import type { UnitOfWorkPort } from '../../domain/ports/unit-of-work.port';
import type { CheckoutPricingPort } from '../../domain/ports/checkout-pricing.port';
import type { FinalizeCheckoutPaymentUseCase } from './finalize-checkout-payment.use-case';

export type CheckoutError =
  | ProductNotFoundError
  | ProductOutOfStockError
  | PaymentGatewayNotConfiguredError
  | PaymentProviderError
  | Error;

export class CheckoutUseCase {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly checkoutRepository: CheckoutRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly checkoutPricing: CheckoutPricingPort,
    private readonly finalizeCheckoutPayment: FinalizeCheckoutPaymentUseCase,
  ) {}

  async execute(
    command: CheckoutCommand,
  ): Promise<Result<CheckoutTransaction, CheckoutError>> {
    const existing = await this.checkoutRepository.findTransactionByReference(
      command.reference,
    );

    // Idempotencia: si ya está finalizada, o ya se envió a la pasarela
    // (tiene providerReference), no se vuelve a cobrar.
    if (existing && (!existing.isPending() || existing.providerReference)) {
      return Result.ok(existing);
    }

    // Riel, paso 1: crear (o recuperar) la transacción PENDING.
    // Sigue usando throw/catch aquí adentro a propósito: corre dentro de
    // unitOfWork.execute(), y Sequelize solo hace ROLLBACK si el callback
    // rechaza. Retornar un Result.fail en su lugar haría que Sequelize
    // interprete la promesa como resuelta y confirme (COMMIT) un estado
    // a medio construir.
    let pendingTransaction: CheckoutTransaction;
    try {
      pendingTransaction =
        existing ?? (await this.createPendingTransaction(command));
    } catch (error) {
      return Result.fail(this.toCheckoutError(error));
    }

    // Riel, paso 2: cobrar con la pasarela (fuera de la transacción de BD:
    // nunca queremos mantener una transacción abierta esperando una API externa).
    let payment;
    try {
      payment = await this.paymentGateway.chargeCard({
        transactionReference: pendingTransaction.reference,
        amountInCents: pendingTransaction.totalAmountInCents,
        currency: 'COP',
        customerEmail: command.customer.email,
        card: command.card,
      });
    } catch (error) {
      return Result.fail(this.toCheckoutError(error));
    }

    // Riel, paso 3: finalizeCheckoutPayment ya retorna Result — se encadena
    // directo, sin try/catch adicional.
    return this.finalizeCheckoutPayment.execute(
      pendingTransaction.reference,
      payment,
    );
  }

  private async createPendingTransaction(
    command: CheckoutCommand,
  ): Promise<CheckoutTransaction> {
    return this.unitOfWork.execute(async () => {
      const product = await this.productRepository.findById(command.productId);

      if (!product) {
        throw new ProductNotFoundError(command.productId);
      }

      if (!product.hasStockAvailable(command.quantity)) {
        throw new ProductOutOfStockError(command.productId);
      }

      await this.productRepository.reserveStock(product.id, command.quantity);

      const customer =
        (await this.checkoutRepository.findCustomerByEmail(
          command.customer.email,
        )) ?? (await this.checkoutRepository.createCustomer(command.customer));
      const delivery = await this.checkoutRepository.createDelivery({
        ...command.delivery,
        customerId: customer.id,
      });
      const productAmountInCents = product.priceInCents * command.quantity;
      const pricing = this.checkoutPricing.get();

      return this.checkoutRepository.createPendingTransaction({
        reference: command.reference,
        productId: product.id,
        customerId: customer.id,
        deliveryId: delivery.id,
        quantity: command.quantity,
        productAmountInCents,
        baseFeeInCents: pricing.baseFeeInCents,
        deliveryFeeInCents: pricing.deliveryFeeInCents,
        totalAmountInCents:
          productAmountInCents +
          pricing.baseFeeInCents +
          pricing.deliveryFeeInCents,
      });
    });
  }

  private toCheckoutError(error: unknown): CheckoutError {
    if (
      error instanceof ProductNotFoundError ||
      error instanceof ProductOutOfStockError ||
      error instanceof PaymentGatewayNotConfiguredError ||
      error instanceof PaymentProviderError
    ) {
      return error;
    }
    return normalizeError(error);
  }
}
