import type { TransactionStatus } from './transaction-status';

export class CheckoutTransaction {
  constructor(
    public readonly id: string,
    public readonly reference: string,
    public readonly status: TransactionStatus,
    public readonly productId: string,
    public readonly customerId: string,
    public readonly deliveryId: string,
    public readonly quantity: number,
    public readonly productAmountInCents: number,
    public readonly baseFeeInCents: number,
    public readonly deliveryFeeInCents: number,
    public readonly totalAmountInCents: number,
    public readonly providerReference: string | null,
    public readonly providerStatus: string | null,
  ) {}

  isPending(): boolean {
    return this.status === 'PENDING';
  }
}
