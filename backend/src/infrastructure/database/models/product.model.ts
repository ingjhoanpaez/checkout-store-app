import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

@Table({
  tableName: 'products',
})
export class ProductModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    allowNull: false,
  })
  declare name: string;

  @Column({
    allowNull: false,
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare priceInCents: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare stock: number;
}
