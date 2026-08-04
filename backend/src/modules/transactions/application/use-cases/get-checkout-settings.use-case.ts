import { Result } from '@shared/result';
import type {
  CheckoutPricing,
  CheckoutPricingPort,
} from '../../domain/ports/checkout-pricing.port';

export class GetCheckoutSettingsUseCase {
  constructor(private readonly checkoutPricing: CheckoutPricingPort) {}

  execute(): Result<CheckoutPricing> {
    return Result.ok(this.checkoutPricing.get());
  }
}
