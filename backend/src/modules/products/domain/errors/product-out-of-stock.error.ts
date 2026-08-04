export class ProductOutOfStockError extends Error {
  constructor(productId: string) {
    super(`Stock insuficiente para el producto ${productId}`);
    this.name = ProductOutOfStockError.name;
  }
}
