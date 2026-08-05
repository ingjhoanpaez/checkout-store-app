export interface CheckoutSettings {
  currency: 'COP';
  baseFeeInCents: number;
  deliveryFeeInCents: number;
}

export interface CustomerInput {
  fullName: string;
  email: string;
  phone: string;
}

export interface DeliveryInput {
  recipientName: string;
  phone: string;
  addressLine1: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
}

// Vive SOLO en memoria durante el submit. Nunca se persiste en Vuex/localStorage.
export interface CardInput {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

export type CheckoutStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'FAILED';

export interface CheckoutTransaction {
  reference: string;
  status: CheckoutStatus;
  totalAmountInCents: number;
}

export interface CheckoutCommand {
  reference: string;
  productId: string;
  quantity: number;
  customer: CustomerInput;
  delivery: DeliveryInput;
  card: CardInput;
}
