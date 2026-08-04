import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { literal, Op, where } from 'sequelize';
import { ProductModel } from '@infrastructure/database/models/product.model';
import { ProductMapper } from '@infrastructure/mappers/product.mapper';
import { Product } from '@modules/products/domain/product.entity';
import { ProductNotFoundError } from '@modules/products/domain/errors/product-not-found.error';
import { ProductOutOfStockError } from '@modules/products/domain/errors/product-out-of-stock.error';
import { ProductRepositoryPort } from '@modules/products/domain/ports/product-repository.port';
import { SequelizeUnitOfWork } from '@infrastructure/database/sequelize-unit-of-work';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectModel(ProductModel)
    private readonly productModel: typeof ProductModel,
    private readonly unitOfWork: SequelizeUnitOfWork,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const found = await this.productModel.findByPk(id, {
      transaction: this.unitOfWork.getCurrentTransaction(),
    });
    return found ? ProductMapper.toDomain(found) : null;
  }

  async findAll(): Promise<Product[]> {
    const all = await this.productModel.findAll({
      transaction: this.unitOfWork.getCurrentTransaction(),
    });
    return all.map(ProductMapper.toDomain);
  }

  async reserveStock(id: string, quantity: number): Promise<Product> {
    const [affectedCount] = await this.productModel.increment(
      { reservedStock: quantity },
      {
        where: {
          id,
          [Op.and]: [
            where(literal('"stock" - "reservedStock"'), Op.gte, quantity),
          ],
        },
        transaction: this.unitOfWork.getCurrentTransaction(),
      },
    );

    if (!affectedCount) {
      await this.throwReservationError(id);
    }

    return this.findUpdatedProduct(id);
  }

  async commitReservedStock(id: string, quantity: number): Promise<Product> {
    const [affectedCount] = await this.productModel.increment(
      { stock: -quantity, reservedStock: -quantity },
      {
        where: {
          id,
          reservedStock: { [Op.gte]: quantity },
        },
        transaction: this.unitOfWork.getCurrentTransaction(),
      },
    );

    if (!affectedCount) {
      await this.throwReservationError(id);
    }

    return this.findUpdatedProduct(id);
  }

  async releaseReservedStock(id: string, quantity: number): Promise<Product> {
    const [affectedCount] = await this.productModel.increment(
      { reservedStock: -quantity },
      {
        where: {
          id,
          reservedStock: { [Op.gte]: quantity },
        },
        transaction: this.unitOfWork.getCurrentTransaction(),
      },
    );

    if (!affectedCount) {
      await this.throwReservationError(id);
    }

    return this.findUpdatedProduct(id);
  }

  private async findUpdatedProduct(id: string): Promise<Product> {
    const updated = await this.productModel.findByPk(id, {
      transaction: this.unitOfWork.getCurrentTransaction(),
    });
    if (!updated) {
      throw new ProductNotFoundError(id);
    }

    return ProductMapper.toDomain(updated);
  }

  private async throwReservationError(id: string): Promise<never> {
    const product = await this.productModel.findByPk(id, {
      transaction: this.unitOfWork.getCurrentTransaction(),
    });

    if (!product) {
      throw new ProductNotFoundError(id);
    }

    throw new ProductOutOfStockError(id);
  }
}
