import { Product } from './product.entity';

describe('Product', () => {
  const product = new Product(
    'product-id',
    'Producto demo',
    'Descripción demo',
    50_000,
    3,
  );

  it('reports availability only for positive whole quantities within stock', () => {
    expect(product.hasStockAvailable()).toBe(true);
    expect(product.hasStockAvailable(3)).toBe(true);
    expect(product.hasStockAvailable(4)).toBe(false);
    expect(product.hasStockAvailable(0)).toBe(false);
    expect(product.hasStockAvailable(-1)).toBe(false);
    expect(product.hasStockAvailable(1.5)).toBe(false);
  });

  it('returns a new product with decreased stock', () => {
    const updatedProduct = product.withDecreasedStock(2);

    expect(updatedProduct).not.toBe(product);
    expect(updatedProduct.stock).toBe(1);
    expect(product.stock).toBe(3);
  });

  it('rejects a decrement that exceeds available stock', () => {
    expect(() => product.withDecreasedStock(4)).toThrow(
      'Stock insuficiente para el producto product-id',
    );
  });
});
