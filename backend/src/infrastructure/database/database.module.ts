import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import type { DatabaseConfig } from 'src/config/database.config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<DatabaseConfig>) => {
        const db = configService.get<DatabaseConfig>('database')!;

        return {
          dialect: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          autoLoadModels: db.autoLoadModels,
          synchronize: db.synchronize,
          logging: db.logging,
          models: [__dirname + '/models/*.model{.ts,.js}'],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
