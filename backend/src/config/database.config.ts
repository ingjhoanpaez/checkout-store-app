import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { registerAs } from '@nestjs/config';

export default registerAs('database', (): SequelizeModuleOptions => ({
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
