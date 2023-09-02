import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './candidate.entity';
import { CardType } from './card-type.entity';
import { Card } from './card.entity';
import { CardBatch } from './card-batch.entity';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { User } from '../user/user.entity';
import { Follow } from '../relationship/follow.entity';
import { CardLike } from './card-like.entity';
import { ContactInvite } from '../contact/contact-invite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Card,
      CardLike,
      CardType,
      CardBatch,
      Candidate,
      ContactInvite,
      Follow,
      User,
    ]),
  ],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
