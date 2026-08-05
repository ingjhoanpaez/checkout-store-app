import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

import databaseConfig from '@config/database.config';
import { SequelizeUnitOfWork } from './sequelize-unit-of-work';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    SequelizeModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: SequelizeModuleOptions) => config,
    }),
  ],
  providers: [SequelizeUnitOfWork],
  exports: [SequelizeUnitOfWork],
})
export class DatabaseModule {}
