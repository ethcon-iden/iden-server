import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cookie, CookieReason } from './cookie.entity';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { CARD_BATCH_SIZE } from '../../card/card.constant';
import { CardBatchEndedEvent } from '../../card/card.type';

@Injectable()
export class CookieService {
  constructor(
    @InjectRepository(Cookie)
    private readonly cookieRepository: Repository<Cookie>,
  ) {}

  @OnEvent('card.batchEnded')
  async onCardBatchEnded(event: CardBatchEndedEvent) {
    const { userId, cardBatchId, skippedCardCount } = event;
    const reason = CookieReason.VOTE;

    // 이미 이 카드 배치로 적립되었으면 무시
    if (
      await this.cookieRepository.findOneBy({
        reason,
        reasonId: cardBatchId + '',
      })
    ) {
      return;
    }

    // 적립량 계산
    const answeredCount = CARD_BATCH_SIZE - skippedCardCount;

    // 1장도 안 건너뛰었으면 3점 추가
    const bonus = 3 * Number(skippedCardCount === 0);

    const amount = answeredCount + bonus;

    // 적립
    await this.cookieRepository.save({
      userId,
      reason,
      reasonId: cardBatchId + '',
      amount,
    });
  }

  async getCookieBalance(userId: string) {
    const cookies = await this.cookieRepository.find({
      where: { userId },
    });

    return cookies.reduce((sum, cookie) => sum + cookie.amount, 0);
  }
}
