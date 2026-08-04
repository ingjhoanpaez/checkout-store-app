import type {
  CardPaymentData,
  PaymentResult,
} from '@modules/payments/domain/ports/payment-gateway.port';
import type { Customer } from '@modules/customers/domain/customer.entity';
import type { Delivery } from '@modules/deliveries/domain/delivery.entity';
import type { CheckoutTransaction } from '../checkout-transaction.entity';

export const CHECKOUT_REPOSITORY = Symbol('CHECKOUT_REPOSITORY');

export interface CreateCustomerCommand {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
}

export interface CreateDeliveryCommand {
  readonly customerId: string;
  readonly recipientName: string;
  readonly phone: string;
  readonly addressLine1: string;
  readonly city: string;
  readonly region: string;
  readonly country: string;
  readonly postalCode: string | null;
}

export interface CreatePendingTransactionCommand {
  readonly reference: string;
  readonly productId: string;
  readonly customerId: string;
  readonly deliveryId: string;
  readonly quantity: number;
  readonly productAmountInCents: number;
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
  readonly totalAmountInCents: number;
}

export interface CheckoutRepositoryPort {
  findCustomerByEmail(email: string): Promise<Customer | null>;
  createCustomer(command: CreateCustomerCommand): Promise<Customer>;
  createDelivery(command: CreateDeliveryCommand): Promise<Delivery>;
  findTransactionByReference(
    reference: string,
  ): Promise<CheckoutTransaction | null>;
  createPendingTransaction(
    command: CreatePendingTransactionCommand,
  ): Promise<CheckoutTransaction>;
  finalizeTransaction(
    reference: string,
    payment: PaymentResult,
  ): Promise<CheckoutTransaction>;
}

export interface CheckoutCommand {
  readonly reference: string;
  readonly productId: string;
  readonly quantity: number;
  readonly customer: CreateCustomerCommand;
  readonly delivery: Omit<CreateDeliveryCommand, 'customerId'>;
  readonly card: CardPaymentData;
}
