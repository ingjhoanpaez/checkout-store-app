import { Product } from '@modules/products/domain/product.entity';
import { ProductModel } from '@infrastructure/database/models/product.model';

export class ProductMapper {
  static toDomain(this: void, model: ProductModel): Product {
    return new Product(
      model.id,
      model.name,
      model.description,
      model.priceInCents,
      model.stock - model.reservedStock,
    );
  }
}
