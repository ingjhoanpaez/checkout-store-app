import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { CustomerModel } from '@infrastructure/database/models/customer.model';
import { DeliveryModel } from '@infrastructure/database/models/delivery.model';
import { TransactionModel } from '@infrastructure/database/models/transaction.model';
import { CheckoutRepository } from '@infrastructure/repositories/checkout.repository';
import { SequelizeUnitOfWork } from '@infrastructure/database/sequelize-unit-of-work';
import { ProductRepositoryPort } from '@modules/products/domain/ports/product-repository.port';
import {
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from '@modules/payments/domain/ports/payment-gateway.port';
import { PRODUCT_REPOSITORY } from '@modules/products/domain/ports/product-repository.port';
import { CheckoutUseCase } from './application/use-cases/checkout.use-case';
import { FinalizeCheckoutPaymentUseCase } from './application/use-cases/finalize-checkout-payment.use-case';
import { ReconcileCheckoutPaymentUseCase } from './application/use-cases/reconcile-checkout-payment.use-case';
import { GetCheckoutByReferenceUseCase } from './application/use-cases/get-checkout-by-reference.use-case';
import { GetCheckoutSettingsUseCase } from './application/use-cases/get-checkout-settings.use-case';
import { EnvironmentCheckoutPricing } from './infrastructure/configuration/environment-checkout-pricing';
import { CHECKOUT_PRICING } from './domain/ports/checkout-pricing.port';
import { CHECKOUT_REPOSITORY } from './domain/ports/checkout-repository.port';
import { CheckoutRepositoryPort } from './domain/ports/checkout-repository.port';
import { UNIT_OF_WORK } from './domain/ports/unit-of-work.port';
import { UnitOfWorkPort } from './domain/ports/unit-of-work.port';
import { CheckoutController } from './infrastructure/http/checkout.controller';
import { PaymentsModule } from '@modules/payments/payments.module';
import { ProductsModule } from '@modules/products/products.module';

@Module({
  imports: [
    DatabaseModule,
    PaymentsModule,
    ProductsModule,
    SequelizeModule.forFeature([
      CustomerModel,
      DeliveryModel,
      TransactionModel,
    ]),
  ],
  providers: [
    {
      provide: CHECKOUT_REPOSITORY,
      useClass: CheckoutRepository,
    },
    {
      provide: UNIT_OF_WORK,
      useExisting: SequelizeUnitOfWork,
    },
    {
      provide: CHECKOUT_PRICING,
      useClass: EnvironmentCheckoutPricing,
    },
    {
      provide: FinalizeCheckoutPaymentUseCase,
      useFactory: (
        productRepository: ProductRepositoryPort,
        checkoutRepository: CheckoutRepositoryPort,
        unitOfWork: UnitOfWorkPort,
      ) =>
        new FinalizeCheckoutPaymentUseCase(
          productRepository,
          checkoutRepository,
          unitOfWork,
        ),
      inject: [PRODUCT_REPOSITORY, CHECKOUT_REPOSITORY, UNIT_OF_WORK],
    },
    {
      provide: CheckoutUseCase,
      useFactory: (
        productRepository: ProductRepositoryPort,
        checkoutRepository: CheckoutRepositoryPort,
        paymentGateway: PaymentGatewayPort,
        unitOfWork: UnitOfWorkPort,
        checkoutPricing: EnvironmentCheckoutPricing,
        finalizeCheckoutPayment: FinalizeCheckoutPaymentUseCase,
      ) =>
        new CheckoutUseCase(
          productRepository,
          checkoutRepository,
          paymentGateway,
          unitOfWork,
          checkoutPricing,
          finalizeCheckoutPayment,
        ),
      inject: [
        PRODUCT_REPOSITORY,
        CHECKOUT_REPOSITORY,
        PAYMENT_GATEWAY,
        UNIT_OF_WORK,
        CHECKOUT_PRICING,
        FinalizeCheckoutPaymentUseCase,
      ],
    },
    {
      provide: ReconcileCheckoutPaymentUseCase,
      useFactory: (
        checkoutRepository: CheckoutRepositoryPort,
        paymentGateway: PaymentGatewayPort,
        finalizeCheckoutPayment: FinalizeCheckoutPaymentUseCase,
      ) =>
        new ReconcileCheckoutPaymentUseCase(
          checkoutRepository,
          paymentGateway,
          finalizeCheckoutPayment,
        ),
      inject: [
        CHECKOUT_REPOSITORY,
        PAYMENT_GATEWAY,
        FinalizeCheckoutPaymentUseCase,
      ],
    },
    {
      provide: GetCheckoutByReferenceUseCase,
      useFactory: (checkoutRepository: CheckoutRepositoryPort) =>
        new GetCheckoutByReferenceUseCase(checkoutRepository),
      inject: [CHECKOUT_REPOSITORY],
    },
    {
      provide: GetCheckoutSettingsUseCase,
      useFactory: (checkoutPricing: EnvironmentCheckoutPricing) =>
        new GetCheckoutSettingsUseCase(checkoutPricing),
      inject: [CHECKOUT_PRICING],
    },
  ],
  controllers: [CheckoutController],
  exports: [CHECKOUT_REPOSITORY, UNIT_OF_WORK],
})
export class TransactionsModule {}
