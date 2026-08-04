import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Result } from '../src/shared/result';
import { GetProductsUseCase } from '../src/modules/products/application/use-cases/get-products.use-case';
import { Product } from '../src/modules/products/domain/product.entity';
import { ProductsController } from '../src/modules/products/infrastructure/http/products.controller';

describe('ProductsController (e2e)', () => {
  let app: INestApplication<App>;
  const getProductsUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: GetProductsUseCase,
          useValue: getProductsUseCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /products returns the use case result', async () => {
    getProductsUseCase.execute.mockResolvedValue(
      Result.ok([
        new Product(
          'product-id',
          'Producto demo',
          'Descripción demo',
          50_000,
          3,
        ),
      ]),
    );

    return request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect([
        {
          id: 'product-id',
          name: 'Producto demo',
          description: 'Descripción demo',
          priceInCents: 50_000,
          stock: 3,
        },
      ]);
  });

  afterEach(async () => {
    await app.close();
    getProductsUseCase.execute.mockReset();
  });
});
