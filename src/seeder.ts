import { TypeOrmModule } from '@nestjs/typeorm';
import { seeder } from 'nestjs-seeder';
import { User } from './domain/user/user.entity';
import { AppConfigModule } from './infrastructure/config/app.config.module';
import { CardModule } from './domain/card/card.module';
import { AppModule } from './app.module';
import { Card } from './domain/card/card.entity';
import { CardService } from './domain/card/card.service';
import { CardType } from './domain/card/card-type.entity';
import { Candidate } from './domain/card/candidate.entity';
import { CardBatch } from './domain/card/card-batch.entity';
import { Follow } from './domain/relationship/follow.entity';
import { CardLike } from './domain/card/card-like.entity';
import { UserModule } from './domain/user/user.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { RelationshipModule } from './domain/relationship/relationship.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ContactModule } from './domain/contact/contact.module';
import { Cookie } from './domain/item/cookie/cookie.entity';
import { RelationshipService } from './domain/relationship/relationship.service';
import { Block } from './domain/relationship/block.entity';
import { Hide } from './domain/relationship/hide.entity';
import { ContactService } from './domain/contact/contact.service';
import { Contact } from './domain/contact/contact.entity';
import { UserSeeder } from './infrastructure/seed/user.seeder';
import { ContactSeeder } from './infrastructure/seed/contact.seeder';
import { RelationshipSeeder } from './infrastructure/seed/relationship.seeder';
import { CardSeeder } from './infrastructure/seed/card.seeder';
import { ContactInvite } from './domain/contact/contact-invite.entity';

seeder({
  imports: [
    AppConfigModule,
    AppModule,
    AuthModule,
    CardModule,
    ContactModule,
    UserModule,
    RelationshipModule,
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
    }),
    CardModule,
    TypeOrmModule.forFeature([
      Block,
      Card,
      CardBatch,
      CardLike,
      CardType,
      Candidate,
      Contact,
      ContactInvite,
      Hide,
      Follow,
      User,
      Cookie,
    ]),
  ],
  providers: [CardService, ContactService, RelationshipService],
}).run([UserSeeder, ContactSeeder, RelationshipSeeder, CardSeeder]);
