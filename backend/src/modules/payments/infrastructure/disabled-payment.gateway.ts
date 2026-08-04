import { Injectable } from '@nestjs/common';
import { PaymentGatewayNotConfiguredError } from '../domain/errors/payment-gateway-not-configured.error';
import type {
  ChargeCardPaymentCommand,
  PaymentGatewayPort,
  PaymentResult,
} from '../domain/ports/payment-gateway.port';

@Injectable()
export class DisabledPaymentGateway implements PaymentGatewayPort {
  chargeCard(command: ChargeCardPaymentCommand): Promise<PaymentResult> {
    void command;
    throw new PaymentGatewayNotConfiguredError();
  }

  getPaymentStatus(providerReference: string): Promise<PaymentResult> {
    void providerReference;
    throw new PaymentGatewayNotConfiguredError();
  }
}
