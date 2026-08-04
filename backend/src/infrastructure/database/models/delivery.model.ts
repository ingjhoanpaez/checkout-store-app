import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

@Table({ tableName: 'deliveries' })
export class DeliveryModel extends Model<
  InferAttributes<DeliveryModel>,
  InferCreationAttributes<DeliveryModel>
> {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: CreationOptional<string>;

  @Column({ allowNull: false, type: DataType.UUID })
  declare customerId: string;

  @Column({ allowNull: false })
  declare recipientName: string;

  @Column({ allowNull: false })
  declare phone: string;

  @Column({ allowNull: false })
  declare addressLine1: string;

  @Column({ allowNull: false })
  declare city: string;

  @Column({ allowNull: false })
  declare region: string;

  @Column({ allowNull: false })
  declare country: string;

  @Column({ allowNull: true, type: DataType.STRING })
  declare postalCode: string | null;
}
