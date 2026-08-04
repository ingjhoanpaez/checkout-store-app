import { Product } from '../product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

// Puerto (interfaz) que el dominio espera. La infraestructura (Sequelize)
// implementa esto sin que el dominio sepa que existe una BD detrás.
export interface ProductRepositoryPort {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  reserveStock(id: string, quantity: number): Promise<Product>;
  commitReservedStock(id: string, quantity: number): Promise<Product>;
  releaseReservedStock(id: string, quantity: number): Promise<Product>;
}
