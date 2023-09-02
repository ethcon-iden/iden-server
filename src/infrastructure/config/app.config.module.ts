import { Module } from '@nestjs/common';
import { TypeOrmConfigModule } from './typeorm-config/typeorm-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './typeorm-config/typeorm-config.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmConfigModule],
      useClass: TypeOrmConfigService,
      inject: [TypeOrmConfigModule],
    }),
  ],
})
export class AppConfigModule {}
