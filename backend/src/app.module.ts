import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';
import { validateEnvironment } from '@config/environment';

import { DatabaseModule } from '@infrastructure/database/database.module';
import { CustomersModule } from '@modules/customers/customers.module';
import { DeliveriesModule } from '@modules/deliveries/deliveries.module';
import { PaymentsModule } from '@modules/payments/payments.module';
import { ProductsModule } from '@modules/products/products.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    DatabaseModule,
    CustomersModule,
    DeliveriesModule,
    PaymentsModule,
    ProductsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
