import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './domain/user/user.module';
import { AppConfigModule } from './infrastructure/config/app.config.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { CardModule } from './domain/card/card.module';
import { RelationshipModule } from './domain/relationship/relationship.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CookieModule } from './domain/item/cookie/cookie.module';
import { ContactModule } from './domain/contact/contact.module';

@Module({
  imports: [
    AppConfigModule,
    AuthModule,
    CardModule,
    UserModule,
    CookieModule,
    ContactModule,
    RelationshipModule,
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
