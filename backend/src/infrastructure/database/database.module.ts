import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<SequelizeModuleOptions['host']>(
          'database.host',
        ),
        port: configService.get<SequelizeModuleOptions['port']>(
          'database.port',
        ),
        username:
          configService.get<SequelizeModuleOptions['username']>(
            'database.username',
          ),
        password:
          configService.get<SequelizeModuleOptions['password']>(
            'database.password',
          ),
        database:
          configService.get<SequelizeModuleOptions['database']>(
            'database.name',
          ),
        autoLoadModels: configService.get<
          SequelizeModuleOptions['autoLoadModels']
        >('database.autoLoadModels'),
        synchronize: configService.get<SequelizeModuleOptions['synchronize']>(
          'database.synchronize',
        ),
        logging:
          configService.get<SequelizeModuleOptions['logging']>(
            'database.logging',
          ),
        models: [__dirname + '/models/*.model{.ts,.js}'],
      }),
    }),
  ],
})
export class DatabaseModule {}
