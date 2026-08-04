export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly priceInCents: number,
    public readonly stock: number,
  ) {}

  hasStockAvailable(quantity: number = 1): boolean {
    return (
      Number.isSafeInteger(quantity) && quantity > 0 && this.stock >= quantity
    );
  }

  withDecreasedStock(quantity: number): Product {
    if (!this.hasStockAvailable(quantity)) {
      throw new Error(`Stock insuficiente para el producto ${this.id}`);
    }
    return new Product(
      this.id,
      this.name,
      this.description,
      this.priceInCents,
      this.stock - quantity,
    );
  }
}
