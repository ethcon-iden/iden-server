import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Not, Repository } from 'typeorm';
import { Card } from './card.entity';
import { CardType } from './card-type.entity';
import { Candidate } from './candidate.entity';
import { CardBatch } from './card-batch.entity';
import { Gender, User } from '../user/user.entity';
import { CardCommentDTO, CardReadDTO, CardVoteDTO } from './card.dto';
import { CARD_BATCH_SIZE } from './card.constant';
import { CardBatchEndedEvent } from './card.type';
import { buildPaginator } from 'typeorm-cursor-pagination';
import { Follow } from '../relationship/follow.entity';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { CardLike } from './card-like.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

function getMultipleRandom(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, num);
}

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
    @InjectRepository(CardType)
    private readonly cardTypeRepository: Repository<CardType>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(CardBatch)
    private readonly cardBatchRepository: Repository<CardBatch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(CardLike)
    private readonly cardLikeRepository: Repository<CardLike>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getCardQueryBuilder(userId: string) {
    return await this.cardRepository
      .createQueryBuilder('card')
      .loadRelationCountAndMap('card.likeCount', 'card.cardLikes', 'cardLike')
      .loadRelationCountAndMap(
        'card.likedByMe',
        'card.cardLikes',
        'likedByMe',
        (qb) =>
          qb.andWhere('"likedByMe"."likerId" = :userId', {
            userId,
          }),
      );
  }

  async calculateFillBoxRatio(card: Card) {
    const selectRateQuery = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.candidates', 'candidates')
      .where(
        new Brackets((qb) => {
          for (const candidate of card.candidates) {
            qb.orWhere(
              `(card.cardTypeId = ${card.cardTypeId} AND candidates.userId = '${candidate.userId}')`,
            );
          }
        }),
      )
      .andWhere({ receiverId: Not(IsNull()) });

    const cardsWithSameCandidateAndType = await selectRateQuery.getMany();

    // 이 후보자들이 같은 카드 타입에서 등장한 카드들 - 선택 비율을 계산하기 위해서
    const selectRates = new Map<Candidate, number>();

    for (const candidate of card.candidates) {
      const totalAppearances = cardsWithSameCandidateAndType.filter(
        (cardElement) =>
          cardElement.candidates.find((c) => c.userId === candidate.userId) &&
          cardElement.cardTypeId === card.cardTypeId,
      ).length;

      if (totalAppearances === 0) {
        selectRates.set(candidate, 0);
        continue;
      }

      const totalVotes = cardsWithSameCandidateAndType.filter(
        (cardElement) =>
          cardElement.receiverId === candidate.userId &&
          cardElement.cardTypeId === card.cardTypeId,
      ).length;

      selectRates.set(candidate, totalVotes / totalAppearances);

      const MAX = 1;
      const MIN = 0.2;

      for (const candidate of card.candidates) {
        (candidate as any).fillBoxRatio = '' + Math.random();
      }
    }
  }

  async getCard(userId: string, cardId: number) {
    const card = await (await this.getCardQueryBuilder(userId))
      .leftJoinAndSelect('card.sender', 'sender')
      .leftJoinAndSelect('card.receiver', 'receiver')
      .leftJoinAndSelect('card.candidates', 'candidates')
      .leftJoinAndSelect('candidates.user', 'user')
      .where('card.id = :cardId', { cardId })
      .getOne();

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    return card;
  }

  async saveCards(
    cardTypes: CardType[],
    senderId: string,
    cardBatchId: number,
  ) {
    const values = [];
    for (const [index, cardType] of cardTypes.entries()) {
      values.push({
        cardBatchId: cardBatchId,
        question: cardType.question,
        emoji: cardType.emoji,
        senderId: senderId,
        cardTypeId: cardType.id,
        order: index + 1,
      });
    }
    await this.cardRepository
      .createQueryBuilder('card')
      .insert()
      .values(values)
      .execute();
  }

  async startBatch(userId: string) {
    // TODO : 주석 해제 (테스트용 주석)
    // const cardBatchExistsInCoolDown =
    //   (await this.cardBatchRepository
    //     .createQueryBuilder('cardBatch')
    //     .where({ userId })
    //     .andWhere('cardBatch.endedAt > :thTime', {
    //       thTime: new Date(new Date().getTime() - BATCH_COOL_DOWN),
    //     })
    //     .getCount()) > 0;
    // if (cardBatchExistsInCoolDown) {
    //   const didInviteUserInCoolDown =
    //     (await this.contactInviteRepository.count({
    //       where: {
    //         userId,
    //         reason: ContactInviteReason.VOTE_WAITING_RESET,
    //         didResetCardCooldown: false,
    //       },
    //     })) > 0;
    //   if (didInviteUserInCoolDown) {
    //     this.contactInviteRepository.update(
    //       {
    //         didResetCardCooldown: true,
    //       },
    //       {
    //         userId,
    //         reason: ContactInviteReason.VOTE_WAITING_RESET,
    //       },
    //     );
    //   } else {
    //     throw new BadRequestException(
    //       '배치가 끝난 뒤 30분이 지나야 새 배치 시작이 가능합니다.',
    //     );
    //   }
    // }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sentFollows', 'sentFollows')
      .leftJoinAndSelect('sentFollows.followedUser', 'followedUser')
      .where({ id: userId })
      .getOne();

    const cardBatch = await this.cardBatchRepository.save(
      await this.cardBatchRepository.create({ userId }),
    );

    // get 12 random card types
    const cardTypes = await this.cardTypeRepository
      .createQueryBuilder('cardType')
      .orderBy('RANDOM()')
      .limit(CARD_BATCH_SIZE)
      .getMany();

    // create 12 cards
    const senderId = userId;
    await this.saveCards(cardTypes, senderId, cardBatch.id);

    // create candidates
    // todo: 내가 팔로우하는 사람으로 수정
    const cards = await this.cardRepository
      .createQueryBuilder('card')
      .where({ cardBatchId: cardBatch.id })
      .getMany();

    const users = await this.userRepository
      .createQueryBuilder('user')
      .getMany();

    const candidateSaveData = [];
    for (const card of cards) {
      let candidates;
      if (card.order === 1) {
        candidates = users.filter((user) => user.nickname.startsWith('FIRST_'));
      } else {
        candidates = getMultipleRandom(users, 4);
      }
      if (card.order === 2) {
        candidates[0] = users.filter((user) => user.nickname === 'FIRST_1')[0];
      }
      for (const user of candidates) {
        candidateSaveData.push(
          await this.candidateRepository.create({
            cardId: card.id,
            userId: user.id,
          }),
        );
      }
    }

    await this.candidateRepository.save(candidateSaveData);

    const data = await this.cardBatchRepository
      .createQueryBuilder('cardBatch')
      .leftJoinAndSelect('cardBatch.cards', 'cards')
      .leftJoinAndSelect('cards.candidates', 'candidates')
      .leftJoinAndSelect('candidates.user', 'user')
      .where({ id: cardBatch.id })
      .getOne();

    return data;
  }

  async getOpenBatch(userId: string) {
    const cardBatch = await this.cardBatchRepository
      .createQueryBuilder('cardBatch')
      .leftJoinAndSelect('cardBatch.cards', 'cards', 'cards.votedAt IS NULL')
      .leftJoinAndSelect('cards.candidates', 'candidates')
      .leftJoinAndSelect('candidates.user', 'user')
      .where({ userId, endedAt: IsNull() })
      .getOne();

    return cardBatch;
  }

  async endBatch(userId: string, cardBatchId: number): Promise<CardBatch> {
    // 유저의 배치가 맞는지 확인
    const cardBatch = await this.cardBatchRepository
      .createQueryBuilder('cardBatch')
      .leftJoinAndSelect('cardBatch.cards', 'cards')
      .where({ id: cardBatchId, userId })
      .getOne();

    if (!cardBatch || cardBatch.endedAt) {
      throw new NotFoundException('존재하지 않거나, 이미 종료된 배치입니다.');
    }

    // 선택 안 했던 카드들 votedAt 기록
    const now = new Date();
    for (const card of cardBatch.cards.filter((card) => !card.votedAt)) {
      this.cardRepository.update(card.id, { votedAt: now });
    }

    // 선택 안 했던 카드들 수 계산
    const skippedCardCount = cardBatch.cards.filter(
      (card) => !card.receiverId,
    ).length;

    // 포인트 적립을 위한 이벤트 발생
    const event: CardBatchEndedEvent = {
      userId,
      cardBatchId,
      skippedCardCount,
    };
    await this.eventEmitter.emitAsync('card.batchEnded', event);

    // 배치 종료
    await this.cardBatchRepository.update(cardBatchId, {
      endedAt: now,
    });
    cardBatch.endedAt = now;

    return cardBatch;
  }

  async vote(userId: string, cardId: string, body: CardVoteDTO) {
    const { candidateUserId } = body;

    console.log('vote body >>> ', body);

    const card = await this.cardRepository
      .createQueryBuilder('card')
      .withDeleted()
      .leftJoinAndSelect('card.candidates', 'candidates')
      .leftJoinAndSelect('candidates.user', 'user')
      .where({ id: cardId })
      .getOne();

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    if (card.senderId !== userId) {
      throw new BadRequestException('본인의 카드가 아닙니다.');
    }

    if (card.receiverId) {
      throw new BadRequestException('이미 투표한 카드입니다.');
    }

    const candidate = card.candidates.find(
      (candidate) => candidate.userId === candidateUserId,
    );
    if (candidateUserId && !candidate) {
      throw new NotFoundException('후보가 아닙니다.');
    }

    // 투표 전에 카드의 채워진 박스 비율을 계산
    await this.calculateFillBoxRatio(card);

    await this.cardRepository.update(cardId, {
      receiverId: candidateUserId || null,
      votedAt: new Date(),
      isSpector: card.isSpector,
    });
    card.receiverId = candidateUserId;
    card.receiver = candidate?.user || null;
    card.votedAt = new Date();
    card.commentedOrVotedAt = new Date();

    if (candidateUserId) {
      // 자기가 투표한 카드는 자기가 공감한 것으로 등록
      await this.cardLikeRepository.save({
        likerId: card.senderId,
        cardId: card.id,
      });
    }

    // 마지막 카드에 대한 투표인 경우 카드 배치 종료
    if (card.order === CARD_BATCH_SIZE) {
      this.endBatch(userId, card.cardBatchId);
    }

    return card;
  }

  async reset(userId: string, cardId: number) {
    // validation
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .where({ id: cardId })
      .getOne();
    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }
    if (card.receiverId) {
      throw new BadRequestException('이미 투표한 카드입니다.');
    }
    // TODO: 릴리즈할 때는 주석 해제
    // if (card.candidateResetCount >= CARD_MAX_RESET_COUNT) {
    //   throw new BadRequestException('카드를 더 이상 리셋할 수 없습니다.');
    // }

    // reset
    // TODO: 팔로우하는 사람으로 수정
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where({ id: Not(userId) })
      .getMany();
    const candidates: User[] = getMultipleRandom(users, 4);

    await this.candidateRepository.delete({ cardId });

    for (const user of candidates) {
      const newCandidate = await this.candidateRepository.create({
        cardId,
        userId: user.id,
      });
      await this.candidateRepository.save(newCandidate);
    }

    await this.cardRepository.update(cardId, {
      candidateResetCount: card.candidateResetCount + 1,
    });

    return await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.candidates', 'candidates')
      .leftJoinAndSelect('candidates.user', 'user')
      .where({ id: cardId })
      .getOne();
  }

  async getReceivedCards(
    myUserId: string,
    beforeCursor,
    afterCursor,
    targetUserId: string | undefined,
    filterUnreadCard: BooleanEnum,
    senderGender: Gender | undefined,
    filterNameRevealed: BooleanEnum,
  ) {
    const querybuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.sender', 'sender')
      .select([
        'card.id',
        'card.question',
        'card.votedAt',
        'card.isSpector',
        'card.isCardReadByReceiver',
        'card.revealedFullName',
        'card.revealedLastCharacter',
        'sender.gender',
      ])
      .andWhere({
        receiverId: targetUserId ?? myUserId,
      });

    if (filterUnreadCard === BooleanEnum.TRUE) {
      querybuilder.andWhere({ isCardReadByReceiver: false });
    }

    if (senderGender) {
      querybuilder.andWhere('sender.gender = :senderGender', { senderGender });
    }

    if (filterNameRevealed === BooleanEnum.TRUE) {
      querybuilder.andWhere(
        new Brackets((qb) => {
          qb.where({
            revealedLastCharacter: Not(IsNull()),
          }).orWhere({
            revealedFullName: Not(IsNull()),
          });
        }),
      );
    }

    const pagintor = await buildPaginator({
      entity: Card,
      alias: 'card',
      paginationKeys: ['votedAt'],
      query: {
        limit: 15,
        order: 'DESC',
        beforeCursor: beforeCursor,
        afterCursor: afterCursor,
      },
    });
    return await pagintor.paginate(querybuilder);
  }

  async getSentCards(
    myUserId: string,
    beforeCursor,
    afterCursor,
    targetUserId: string | undefined,
    filterCommented: BooleanEnum | undefined,
    receiverGender: Gender | undefined,
  ) {
    const querybuilder = this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.receiver', 'receiver')
      .select([
        'card.id',
        'card.question',
        'card.votedAt',
        'card.isSpector',
        'card.isCommentReadBySender',
        'card.comment',
        'receiver.name',
        'receiver.gender',
        'receiver.profileImageKey',
        'receiver.id',
      ])
      .andWhere({
        senderId: targetUserId ?? myUserId,
        receiverId: Not(IsNull()),
      });

    console.log(targetUserId ?? myUserId);
    console.log(await querybuilder.getMany());

    if (filterCommented === BooleanEnum.TRUE) {
      querybuilder.andWhere({ comment: Not(IsNull()) });
    }

    if (receiverGender) {
      querybuilder.andWhere('receiver.gender = :receiverGender', {
        receiverGender,
      });
    }

    const pagintor = await buildPaginator({
      entity: Card,
      alias: 'card',
      paginationKeys: ['votedAt'],
      query: {
        limit: 15,
        order: 'DESC',
        beforeCursor: beforeCursor,
        afterCursor: afterCursor,
      },
    });
    return await pagintor.paginate(querybuilder);
  }

  async getCounts(userId: string) {
    const receivedCardCount = await this.cardRepository
      .createQueryBuilder('card')
      .where({ receiverId: userId })
      .getCount();

    const receivedCommentCount = await this.cardRepository
      .createQueryBuilder('card')
      .where({ senderId: userId, comment: Not(IsNull()) })
      .getCount();

    return {
      receivedCardCount,
      receivedCommentCount,
    };
  }

  /**
   * 최고의 카드 및 최근 카드를 가져온다.
   * @param userId: 카드를 받은 사람
   * @param myUserId: 이 정보를 조회하는 사람
   */
  async getBestCards(userId: string, myUserId: string) {
    if (userId === 'd42823d0-82e0-45f0-b605-dadbd9e275c3') {
      return [
        {
          question: '의사소통 능력이 뛰어난 사람',
          emoji: '🎤',
          cardCount: 127,
          likeCount: 152,
        },
        {
          question: '책임감이 강한 사람',
          emoji: '💎',
          cardCount: 72,
          likeCount: 93,
        },
        {
          question: '협업에 능한 사람',
          emoji: '🤝',
          cardCount: 50,
          likeCount: 61,
        },
      ];
    }
    console.log(userId);
    console.log(
      await this.cardTypeRepository
        .createQueryBuilder('cardType')
        .innerJoin('cardType.cards', 'card', 'card.receiverId = :userId', {
          userId,
        })
        .getMany(),
    );
    const bestCardsTypesQb = await this.cardTypeRepository
      .createQueryBuilder('cardType')
      .innerJoin('cardType.cards', 'card', 'card.receiverId = :userId', {
        userId,
      })
      .leftJoin('card.cardLikes', 'cardLikes')
      .select('cardType.emoji', 'emoji')
      .addSelect('cardType.question', 'question')
      .addSelect('COUNT(DISTINCT card.id)', 'cardCount')
      .addSelect('COUNT(DISTINCT cardLikes.id)', 'likeCount')
      .orderBy('COUNT(DISTINCT card.id) + COUNT(DISTINCT cardLikes.id)', 'DESC')
      .groupBy('cardType.id')
      .limit(3);

    const bestCardsTypes = await bestCardsTypesQb.getRawMany();
    return bestCardsTypes;
  }

  async getRecentCards(
    userId: string,
    myUserId: string,
    beforeCursor: string | undefined,
    afterCursor: string | undefined,
  ) {
    const querybuilder = await (
      await this.getCardQueryBuilder(myUserId)
    )
      .leftJoin('card.sender', 'sender')
      .select([
        'card.id',
        'card.question',
        'card.votedAt',
        'card.commentedAt',
        'card.emoji',
        'card.commentedOrVotedAt',
        'card.comment',
        'sender.gender',
      ])
      .where({
        receiverId: userId,
      })
      .andWhere('card.commentedOrVotedAt > :threeDaysAgo', {
        threeDaysAgo: new Date(
          new Date(new Date().getTime() - 72 * 60 * 60 * 1000), // 72시간 전
        ),
      });

    const pagintor = await buildPaginator({
      entity: Card,
      alias: 'card',
      paginationKeys: ['commentedOrVotedAt'],
      query: {
        limit: 15,
        order: 'DESC',
        beforeCursor: beforeCursor,
        afterCursor: afterCursor,
      },
    });

    return await pagintor.paginate(querybuilder);
  }

  async getFeed(
    userId: string,
    beforeCursor: string | undefined,
    afterCursor: string | undefined,
    filterFavorite: BooleanEnum,
  ) {
    const followingQuery = await this.followRepository
      .createQueryBuilder('follow')
      .where({ followerId: userId });

    if (filterFavorite === BooleanEnum.TRUE) {
      followingQuery.andWhere('follow.isFavorite = true');
    }

    const querybuilder = (await this.getCardQueryBuilder(userId))
      .leftJoin('card.sender', 'sender')
      .leftJoin('card.receiver', 'receiver')
      .select([
        'card.id',
        'card.question',
        'card.votedAt',
        'card.emoji',
        'card.comment',
        'card.commentedAt',
        'card.commentedOrVotedAt',
        'receiver.id',
        'receiver.name',
        'receiver.profileImageKey',
        'receiver.gender',
        'receiver.affiliation',
        'sender.id',
        'sender.gender',
        'sender.name',
      ])
      .where({
        receiverId: In(
          (await followingQuery.getMany()).map(
            (follow: Follow) => follow.followedId,
          ),
        ),
        senderId: Not(userId),
      });

    const pagintor = await buildPaginator({
      entity: Card,
      alias: 'card',
      paginationKeys: ['commentedOrVotedAt'],
      query: {
        limit: 15,
        order: 'DESC',
        beforeCursor: beforeCursor,
        afterCursor: afterCursor,
      },
    });

    return await pagintor.paginate(querybuilder);
  }

  async comment(userId: string, cardId: number, body: CardCommentDTO) {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .where({ id: cardId })
      .getOne();

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    if (card.receiverId !== userId) {
      throw new ForbiddenException(
        '카드를 받은 사람만 답글을 남길 수 있습니다.',
      );
    }

    if (card.comment) {
      throw new BadRequestException('이미 답글을 남겼습니다.');
    }

    await this.cardRepository.update(cardId, {
      comment: body.comment,
      commentedOrVotedAt: new Date(),
    });

    return await this.cardRepository.findOneBy({ id: cardId });
  }

  async deleteComment(userId: string, cardId: number) {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .where({ id: cardId })
      .getOne();

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    if (card.receiverId !== userId) {
      throw new ForbiddenException(
        '카드를 받은 사람만 댓글을 삭제할 수 있습니다.',
      );
    }

    if (!card.comment) {
      throw new BadRequestException('답글이 없습니다.');
    }

    await this.cardRepository.update(cardId, {
      comment: null,
      commentedOrVotedAt: card.votedAt,
    });

    return await this.cardRepository.findOneBy({ id: cardId });
  }

  async like(userId: string, cardId: number) {
    const cardLike = await this.cardLikeRepository
      .createQueryBuilder('cardLike')
      .where({ cardId, likerId: userId })
      .getOne();

    if (cardLike) {
      throw new BadRequestException('이미 공감한 카드입니다.');
    }

    const newCardLike = await this.cardLikeRepository.create({
      cardId,
      likerId: userId,
    });

    return await this.cardLikeRepository.save(newCardLike);
  }

  async unlike(userId: string, cardId: number) {
    const cardLike = await this.cardLikeRepository
      .createQueryBuilder('cardLike')
      .where({ cardId, likerId: userId })
      .getOne();

    if (!cardLike) {
      throw new BadRequestException('공감하지 않은 카드입니다.');
    }

    await this.cardLikeRepository.delete({ cardId, likerId: userId });

    return cardLike;
  }

  async read(userId: string, cardId: number, body: CardReadDTO) {
    console.log(body);
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .where({ id: cardId })
      .getOne();

    if (!card) {
      throw new NotFoundException('존재하지 않는 카드입니다.');
    }

    const { isCardReadByReceiver, isCommentReadBySender } = body;

    if (
      isCardReadByReceiver === BooleanEnum.TRUE &&
      card.receiverId !== userId
    ) {
      throw new ForbiddenException(
        '카드를 받은 사람만 카드 읽음 처리를 할 수 있습니다.',
      );
    }

    if (
      isCommentReadBySender === BooleanEnum.TRUE &&
      card.senderId !== userId
    ) {
      throw new ForbiddenException(
        '카드를 보낸 사람만 댓글 읽음 처리를 할 수 있습니다.',
      );
    }

    await this.cardRepository.update(cardId, {
      isCardReadByReceiver: isCardReadByReceiver === BooleanEnum.TRUE,
      isCommentReadBySender: isCommentReadBySender === BooleanEnum.TRUE,
    });

    return {
      isCardReadByReceiver,
      isCommentReadBySender,
    };
  }

  async readAllReceived(userId: string) {
    await this.cardRepository.update(
      { receiverId: userId },
      { isCardReadByReceiver: true },
    );
  }

  async deleteOpenBatch(userId: string) {
    await this.cardBatchRepository.delete({
      userId,
      endedAt: IsNull(),
    });
  }
}
