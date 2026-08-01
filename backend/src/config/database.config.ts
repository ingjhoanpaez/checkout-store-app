import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { registerAs, ConfigType } from '@nestjs/config';

export interface PostgresConfigOptions extends Omit<
  SequelizeModuleOptions,
  'dialect'
> {
  dialect: 'postgres';
}

export type DatabaseConfig = ConfigType<() => PostgresConfigOptions>;

export default registerAs('database', (): DatabaseConfig => ({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  autoLoadModels: true,
  synchronize: true,
  logging: false,
}));
