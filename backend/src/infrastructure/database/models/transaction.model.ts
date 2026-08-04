import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import type { TransactionStatus } from '@modules/transactions/domain/transaction-status';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({ tableName: 'transactions' })
export class TransactionModel extends Model<
  InferAttributes<TransactionModel>,
  InferCreationAttributes<TransactionModel>
> {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: CreationOptional<string>;

  @Column({ allowNull: false, unique: true })
  declare reference: string;

  @Column({ allowNull: false })
  declare status: TransactionStatus;

  @Column({ allowNull: false, type: DataType.UUID })
  declare productId: string;

  @Column({ allowNull: false, type: DataType.UUID })
  declare customerId: string;

  @Column({ allowNull: false, type: DataType.UUID })
  declare deliveryId: string;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare quantity: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare productAmountInCents: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare baseFeeInCents: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare deliveryFeeInCents: number;

  @Column({ allowNull: false, type: DataType.INTEGER })
  declare totalAmountInCents: number;

  @Column({ allowNull: true, type: DataType.STRING, unique: true })
  declare providerReference: string | null;

  @Column({ allowNull: true, type: DataType.STRING })
  declare providerStatus: string | null;
}
