import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import * as fs from 'fs';

interface DatabaseConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SYNCHRONIZE: boolean;
  BASTION_HOST: string;
  BASTION_USER: string;
  BASTION_KEY: Buffer;
}

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    if (this.configService.get('BASTION_HOST') === undefined)
      return {
        type: 'postgres',
        host: this.configService.get('DB_HOST'),
        port: this.configService.get('DB_PORT'),
        username: this.configService.get('DB_USER'),
        password: this.configService.get('DB_PASSWORD'),
        database: this.configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: this.configService.get('DB_SYNCHRONIZE') === 'true',
        extra: {
          timezone: 'UTC',
        },
      };

    const dbConfig: DatabaseConfig = {
      DB_HOST: this.configService.get('DB_HOST'),
      DB_PORT: this.configService.get('DB_PORT'),
      DB_USER: this.configService.get('DB_USER'),
      DB_PASSWORD: this.configService.get('DB_PASSWORD'),
      DB_NAME: this.configService.get('DB_NAME'),
      DB_SYNCHRONIZE: this.configService.get('DB_SYNCHRONIZE') === 'true',
      BASTION_HOST: this.configService.get('BASTION_HOST'),
      BASTION_USER: this.configService.get('BASTION_USER'),
      BASTION_KEY: fs.readFileSync(this.configService.get('BASTION_KEY_LOC')),
    };

    const sshTunnelConfig = {
      host: dbConfig.BASTION_HOST,
      username: dbConfig.BASTION_USER,
      privateKey: dbConfig.BASTION_KEY,
      dstHost: dbConfig.DB_HOST,
      dstPort: dbConfig.DB_PORT,
      localHost: 'localhost',
      localPort: dbConfig.DB_PORT, // or any other available local port number
    };

    return {
      type: 'postgres',
      host: 'localhost', // use localhost as the database host since we'll be connecting through the SSH tunnel
      port: sshTunnelConfig.localPort,
      username: dbConfig.DB_USER,
      password: dbConfig.DB_PASSWORD,
      database: dbConfig.DB_NAME,
      autoLoadEntities: true,
      synchronize: dbConfig.DB_SYNCHRONIZE,
      extra: {
        timezone: 'UTC',
        ssl: false, // disable SSL since we're connecting through the SSH tunnel
        ssh: sshTunnelConfig,
      },
    };
  }
}
