import type { PaymentResult } from '@modules/payments/domain/ports/payment-gateway.port';
import type { ProductRepositoryPort } from '@modules/products/domain/ports/product-repository.port';
import { Result } from '@shared/result';
import { normalizeError } from '@shared/normalize-error';
import type { CheckoutTransaction } from '../../domain/checkout-transaction.entity';
import { CheckoutTransactionNotFoundError } from '../../domain/errors/checkout-transaction-not-found.error';
import type { CheckoutRepositoryPort } from '../../domain/ports/checkout-repository.port';
import type { UnitOfWorkPort } from '../../domain/ports/unit-of-work.port';

export class FinalizeCheckoutPaymentUseCase {
  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly checkoutRepository: CheckoutRepositoryPort,
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  async execute(
    reference: string,
    payment: PaymentResult,
  ): Promise<
    Result<CheckoutTransaction, CheckoutTransactionNotFoundError | Error>
  > {
    try {
      const transaction = await this.unitOfWork.execute(async () => {
        const checkout =
          await this.checkoutRepository.findTransactionByReference(reference);

        if (!checkout) {
          // throw (no Result.fail): estamos dentro de unitOfWork.execute();
          // lanzar es lo que dispara el ROLLBACK de Sequelize.
          throw new CheckoutTransactionNotFoundError(reference);
        }

        if (!checkout.isPending()) {
          return checkout;
        }

        if (payment.status === 'APPROVED') {
          await this.productRepository.commitReservedStock(
            checkout.productId,
            checkout.quantity,
          );
        } else if (payment.status !== 'PENDING') {
          await this.productRepository.releaseReservedStock(
            checkout.productId,
            checkout.quantity,
          );
        }

        return this.checkoutRepository.finalizeTransaction(reference, payment);
      });

      return Result.ok(transaction);
    } catch (error) {
      if (error instanceof CheckoutTransactionNotFoundError) {
        return Result.fail(error);
      }
      return Result.fail(normalizeError(error));
    }
  }
}
