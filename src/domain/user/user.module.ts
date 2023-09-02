import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserUpdateHistory } from './user-update-history.entity';
import { PhoneVerification } from './phone-verification.entity';
import { ProfileViewCount } from './profile-view-count.entity';
import { Follow } from '../relationship/follow.entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Follow,
      User,
      UserUpdateHistory,
      PhoneVerification,
      ProfileViewCount,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        secure: true,
      },
      defaults: {
        from: '"IDEN" <june@trinitystudio.io.com>',
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
