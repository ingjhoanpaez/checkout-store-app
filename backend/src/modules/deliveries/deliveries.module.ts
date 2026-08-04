import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeliveryModel } from '@infrastructure/database/models/delivery.model';

@Module({
  imports: [SequelizeModule.forFeature([DeliveryModel])],
  exports: [SequelizeModule],
})
export class DeliveriesModule {}
