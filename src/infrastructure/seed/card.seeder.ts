import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Seeder } from 'nestjs-seeder';
import { CardBatch } from 'src/domain/card/card-batch.entity';
import { CardCommentDTO, CardVoteDTO } from 'src/domain/card/card.dto';
import { Card } from 'src/domain/card/card.entity';
import { CardService } from 'src/domain/card/card.service';
import { User } from 'src/domain/user/user.entity';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { testUserPhoneNumber } from './contact.seeder';
import { Faker, ko } from '@faker-js/faker';

@Injectable()
export class CardSeeder implements Seeder {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CardBatch)
    private readonly cardBatchRepository: Repository<CardBatch>,
    private readonly cardService: CardService,
  ) {}

  async seed(): Promise<any> {
    const users = await this.userRepository.findBy({
      nickname: Like('TEST_%'),
    });
    console.log('users length >>> ', users.length);

    const testUser = await this.userRepository.findOneBy({
      phoneNumber: testUserPhoneNumber,
    });

    users.push(testUser);
    users.push(testUser);
    users.push(testUser);
    users.push(testUser);
    users.push(testUser);

    for (const user of users) {
      await this.cardBatchRepository.delete({
        endedAt: IsNull(),
        userId: user.id,
      });

      const cardBatch = await this.cardService.startBatch(user.id);
      console.log('cardBatch >>> ', cardBatch.id);

      for (const card of cardBatch.cards) {
        const candidateUserId = card.candidates[0].userId;
        const body: CardVoteDTO = {
          candidateUserId: Math.random() < 0.2 ? '' : candidateUserId,
        };
        await this.cardService.vote(user.id, card.id + '', body);
      }
    }
    const cards = await this.cardRepository.findBy({
      votedAt: Not(IsNull()),
    });
    for (const card of cards.filter((card) => !card.comment)) {
      if (Math.random() < 0.5) {
        const faker = new Faker({ locale: [ko] });
        const body: CardCommentDTO = {
          comment: faker.lorem.sentence(),
        };
        await this.cardService.comment(card.receiverId, card.id, body);
      }
    }
  }

  async drop(): Promise<any> {
    await this.cardRepository.delete({ senderId: IsNull() });
    return await this.cardBatchRepository.delete({ userId: IsNull() });
  }
}
