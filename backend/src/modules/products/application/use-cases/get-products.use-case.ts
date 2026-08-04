import { Result } from '@shared/result';
import { normalizeError } from '@shared/normalize-error';
import type { Product } from '../../domain/product.entity';
import type { ProductRepositoryPort } from '../../domain/ports/product-repository.port';

export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(): Promise<Result<Product[]>> {
    try {
      const products = await this.productRepository.findAll();
      return Result.ok(products);
    } catch (error) {
      return Result.fail(normalizeError(error));
    }
  }
}
