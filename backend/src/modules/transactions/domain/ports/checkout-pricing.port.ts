export const CHECKOUT_PRICING = Symbol('CHECKOUT_PRICING');

export interface CheckoutPricing {
  readonly currency: 'COP';
  readonly baseFeeInCents: number;
  readonly deliveryFeeInCents: number;
}

export interface CheckoutPricingPort {
  get(): CheckoutPricing;
}
