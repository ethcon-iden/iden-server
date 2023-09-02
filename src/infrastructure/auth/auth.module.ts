import { Module } from '@nestjs/common';
import { UserModule } from 'src/domain/user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
@Module({
  imports: [UserModule, PassportModule],
  providers: [JwtStrategy],
})
export class AuthModule {}
