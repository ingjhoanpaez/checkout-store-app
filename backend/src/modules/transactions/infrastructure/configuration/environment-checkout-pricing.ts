import { readEnvironment } from '@config/environment';
import type {
  CheckoutPricing,
  CheckoutPricingPort,
} from '../../domain/ports/checkout-pricing.port';

export class EnvironmentCheckoutPricing implements CheckoutPricingPort {
  get(): CheckoutPricing {
    return readEnvironment().checkout;
  }
}
