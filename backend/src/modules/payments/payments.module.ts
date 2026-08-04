import { Module } from '@nestjs/common';
import { readEnvironment } from '@config/environment';
import { DisabledPaymentGateway } from './infrastructure/disabled-payment.gateway';
import { WompiPaymentGateway } from './infrastructure/wompi-payment.gateway';
import { PAYMENT_GATEWAY } from './domain/ports/payment-gateway.port';

@Module({
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useFactory: () => {
        const environment = readEnvironment();

        if (environment.payment.provider === 'wompi-sandbox') {
          if (!environment.payment.wompi) {
            throw new Error('Configuración de Wompi sandbox incompleta');
          }

          return new WompiPaymentGateway(environment.payment.wompi);
        }

        return new DisabledPaymentGateway();
      },
    },
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentsModule {}
