import type { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/product.entity';
import { GetProductsUseCase } from './get-products.use-case';

describe('GetProductsUseCase', () => {
  const product = new Product(
    'product-id',
    'Producto demo',
    'Descripción demo',
    50_000,
    3,
  );

  function createRepository(): {
    repository: jest.Mocked<ProductRepositoryPort>;
    findAll: jest.MockedFunction<ProductRepositoryPort['findAll']>;
  } {
    const findAll = jest.fn<ProductRepositoryPort['findAll']>();

    return {
      repository: {
        findById: jest.fn(),
        findAll,
        decreaseStock: jest.fn(),
      },
      findAll,
    };
  }

  it('returns products from the repository', async () => {
    const { repository, findAll } = createRepository();
    findAll.mockResolvedValue([product]);
    const useCase = new GetProductsUseCase(repository);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([product]);
    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('returns a failure result when the repository fails', async () => {
    const { repository, findAll } = createRepository();
    findAll.mockRejectedValue(new Error('Database unavailable'));
    const useCase = new GetProductsUseCase(repository);

    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe('Database unavailable');
  });
});
