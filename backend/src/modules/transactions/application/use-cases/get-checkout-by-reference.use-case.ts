import { Result } from '@shared/result';
import { CheckoutTransactionNotFoundError } from '../../domain/errors/checkout-transaction-not-found.error';
import type { CheckoutTransaction } from '../../domain/checkout-transaction.entity';
import type { CheckoutRepositoryPort } from '../../domain/ports/checkout-repository.port';

export class GetCheckoutByReferenceUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepositoryPort) {}

  async execute(
    reference: string,
  ): Promise<Result<CheckoutTransaction, CheckoutTransactionNotFoundError>> {
    const transaction =
      await this.checkoutRepository.findTransactionByReference(reference);

    if (!transaction) {
      return Result.fail(new CheckoutTransactionNotFoundError(reference));
    }

    return Result.ok(transaction);
  }
}
