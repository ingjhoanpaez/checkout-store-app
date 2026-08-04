import type { TransactionStatus } from '@modules/transactions/domain/transaction-status';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface CardPaymentData {
  readonly cardNumber: string;
  readonly cardholderName: string;
  readonly expirationMonth: string;
  readonly expirationYear: string;
  readonly cvv: string;
}

export interface ChargeCardPaymentCommand {
  readonly transactionReference: string;
  readonly amountInCents: number;
  readonly currency: string;
  readonly customerEmail: string;
  readonly card: CardPaymentData;
}

export interface PaymentResult {
  readonly status: TransactionStatus;
  readonly providerReference: string;
  readonly providerStatus: string;
}

export interface PaymentGatewayPort {
  chargeCard(command: ChargeCardPaymentCommand): Promise<PaymentResult>;
  getPaymentStatus(providerReference: string): Promise<PaymentResult>;
}
