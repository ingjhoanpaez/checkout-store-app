import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { registerAs, ConfigType } from '@nestjs/config';
import { readEnvironment } from './environment';

export interface PostgresConfigOptions extends Omit<
  SequelizeModuleOptions,
  'dialect'
> {
  dialect: 'postgres';
}

export type DatabaseConfig = ConfigType<() => PostgresConfigOptions>;

export function createPostgresConnectionOptions(): PostgresConfigOptions {
  const { database } = readEnvironment();

  return {
    dialect: 'postgres',
    host: database.host,
    port: database.port,
    username: database.user,
    password: database.password,
    database: database.name,
  };
}

export default registerAs('database', (): PostgresConfigOptions => ({
  ...createPostgresConnectionOptions(),
  autoLoadModels: true,
  synchronize: false,
  logging: false,
}));
