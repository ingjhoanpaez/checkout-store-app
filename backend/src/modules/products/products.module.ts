import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { ProductModel } from '@infrastructure/database/models/product.model';
import { ProductRepository } from '@infrastructure/repositories/product.repository';
import { PRODUCT_REPOSITORY } from './domain/ports/product-repository.port';
import type { ProductRepositoryPort } from './domain/ports/product-repository.port';
import { GetProductsUseCase } from './application/use-cases/get-products.use-case';
import { ProductsController } from './infrastructure/http/products.controller';

@Module({
  imports: [DatabaseModule, SequelizeModule.forFeature([ProductModel])],
  controllers: [ProductsController],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    {
      provide: GetProductsUseCase,
      useFactory: (productRepository: ProductRepositoryPort) =>
        new GetProductsUseCase(productRepository),
      inject: [PRODUCT_REPOSITORY],
    },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
