import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cookie } from './cookie.entity';
import { CookieService } from './cookie.service';
import { CookieController } from './cookie.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cookie])],
  providers: [CookieService],
  controllers: [CookieController],
  exports: [CookieService],
})
export class CookieModule {}
