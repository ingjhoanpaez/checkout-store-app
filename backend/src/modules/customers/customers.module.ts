import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CustomerModel } from '@infrastructure/database/models/customer.model';

@Module({
  imports: [SequelizeModule.forFeature([CustomerModel])],
  exports: [SequelizeModule],
})
export class CustomersModule {}
