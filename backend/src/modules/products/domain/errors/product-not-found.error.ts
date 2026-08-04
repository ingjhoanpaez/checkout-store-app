export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Producto ${productId} no encontrado`);
    this.name = ProductNotFoundError.name;
  }
}
