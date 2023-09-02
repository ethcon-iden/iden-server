import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Candidate } from './candidate.entity';
import { User } from '../user/user.entity';
import { Card } from './card.entity';
import { CardBatch } from './card-batch.entity';
import { CursorDTO } from 'src/infrastructure/dto/cursor.dto';
import { BooleanEnum } from 'src/infrastructure/enum/boolean.enum';
import { CardType } from './card-type.entity';

export class CandidateResponseDTO extends Candidate {
  @ApiProperty({
    description: '후보자 유저',
    type: User,
  })
  user: User;
}

export class CardResponseDTO extends Card {
  @ApiProperty({
    description: '후보자들',
    type: CandidateResponseDTO,
    isArray: true,
  })
  candidates: CandidateResponseDTO[];
}

export class BestCardTypeResponseElementDTO extends PickType(CardType, [
  'question',
  'emoji',
]) {
  // cardCount
  @ApiProperty({
    description: '이 질문으로 받은 카드 수',
    type: Number,
  })
  cardCount: number;

  // likeCount
  @ApiProperty({
    description: '이 질문으로 받은 공감 수',
    type: Number,
  })
  likeCount: number;
}

export class CardBatchResponseDTO extends CardBatch {
  @ApiProperty({
    description: '카드들',
    type: CardResponseDTO,
    isArray: true,
  })
  cards: CardResponseDTO[];
}

export class CandidateWithFillBoxRatioDTO extends CandidateResponseDTO {
  @ApiProperty({
    example: 0.5,
    description:
      '카드 박스를 얼마나 채워야 할지: 0 ~ 1 스케일, 이 후보 선택비율로 계산 / 만약 한 번도 이 질문에 후보로 등장한 적이 없는 유저의 경우: null',
  })
  fillBoxRatio: number;
}

export class CardVoteDTO extends PartialType(PickType(Card, ['isSpector'])) {
  @ApiProperty({
    description: '선택하는 후보자 유저의 아이디 / null 이면 skip',
    type: String || null,
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
  })
  candidateUserId: string | null;
}

export class CardVoteResponseDTO extends Card {
  @ApiProperty({
    description: '후보자들',
    type: CandidateWithFillBoxRatioDTO,
    isArray: true,
  })
  candidates: CandidateWithFillBoxRatioDTO[];

  @ApiProperty({
    description: '선택된 (칭찬을 받은) 사람',
    type: User,
  })
  receiver: User;
}

export class CardResetResponseDTO extends Card {
  @ApiProperty({
    description: '후보자들',
    type: CandidateResponseDTO,
    isArray: true,
  })
  candidates: CandidateResponseDTO[];
}

class ReceivedCardSender extends PickType(User, ['gender']) {}

class ReceivedCardElementDTO extends PickType(Card, [
  'id',
  'question',
  'votedAt',
  'isSpector',
  'isCardReadByReceiver',
  'revealedLastCharacter',
  'revealedFullName',
]) {
  @ApiProperty({
    description: '칭찬 보낸 사람',
    type: ReceivedCardSender,
  })
  sender: ReceivedCardSender;
}

export class ReceivedCardListResponseDTO {
  @ApiProperty({
    description: '카드들의 리스트',
    type: ReceivedCardElementDTO,
    isArray: true,
  })
  data: ReceivedCardElementDTO[];

  @ApiProperty({
    description: '전후 페이지의 커서',
    type: CursorDTO,
  })
  cursor: CursorDTO;
}

class SentCardReceiver extends PickType(User, [
  'id',
  'name',
  'gender',
  'profileImageKey',
]) {}

class SentCardElementDTO extends PickType(Card, [
  'id',
  'question',
  'votedAt',
  'isSpector',
  'isCommentReadBySender',
  'comment',
]) {
  @ApiProperty({
    description: '칭찬 받은 사람',
    type: SentCardReceiver,
  })
  receiver: SentCardReceiver;
}

export class SentCardListResponseDTO {
  @ApiProperty({
    description: '카드들의 리스트',
    type: SentCardElementDTO,
    isArray: true,
  })
  data: SentCardElementDTO[];

  @ApiProperty({
    description: '전후 페이지의 커서',
    type: CursorDTO,
  })
  cursor: CursorDTO;
}

export class CardCountsResponseDTO {
  @ApiProperty({
    description: '받은 카드 수',
    type: Number,
  })
  receivedCardCount: number;

  @ApiProperty({
    description: '보낸 카드 중 받은 답글 수',
    type: Number,
  })
  receivedCommentCount: number;
}

export class CardCommentDTO {
  @ApiProperty({
    description: '칭찬 받은 사람이 달 수 있는 코멘트',
    type: String,
    example: '칭찬 감사합니다.',
  })
  comment: string;
}

class FeedReceiver extends PickType(User, [
  'name',
  'gender',
  'profileImageKey',
  'affiliation',
] as const) {}

class FeedSender extends PickType(User, ['gender', 'name']) {}

class CardFeedElement extends PickType(Card, [
  'id',
  'question',
  'emoji',
  'votedAt',
  'commentedAt',
  'comment',
]) {
  @ApiProperty({
    type: FeedReceiver,
    description: '칭찬 받은 사람',
  })
  receiver: FeedReceiver;

  @ApiProperty({
    description: '칭찬 보낸 사람',
    type: FeedSender,
  })
  sender: FeedSender;

  @ApiProperty({
    description: '총 받은 좋아요 수',
    type: Number,
  })
  likeCount: number;

  @ApiProperty({
    description: '내가 좋아요를 눌렀는지 여부 - 눌렀으면 1, 안 눌렀으면 0',
    type: Number,
  })
  likedByMe: number;
}

export class CardFeedResponseDTO {
  @ApiProperty({
    description: '카드들의 리스트',
    type: CardFeedElement,
    isArray: true,
  })
  data: CardFeedElement[];

  @ApiProperty({
    description: '전후 페이지의 커서',
    type: CursorDTO,
  })
  cursor: CursorDTO;
}

class CardRecentResponseElementDTO extends PickType(Card, [
  'id',
  'question',
  'emoji',
  'votedAt',
  'commentedAt',
  'comment',
]) {
  @ApiProperty({
    description: '칭찬 보낸 사람',
    type: FeedSender,
  })
  sender: FeedSender;

  @ApiProperty({
    description: '총 받은 좋아요 수',
    type: Number,
  })
  likeCount: number;

  @ApiProperty({
    description: '내가 좋아요를 눌렀는지 여부 - 눌렀으면 1, 안 눌렀으면 0',
    type: Number,
  })
  likedByMe: number;
}

export class CardRecentResponseDTO {
  @ApiProperty({
    description: '카드들의 리스트',
    type: CardRecentResponseElementDTO,
    isArray: true,
  })
  data: CardRecentResponseElementDTO[];

  @ApiProperty({
    description: '전후 페이지의 커서',
    type: CursorDTO,
  })
  cursor: CursorDTO;
}

export class CardDetailResponseDTO extends Card {
  @ApiProperty({
    type: User,
    description: '칭찬 받은 사람',
  })
  receiver: User;

  @ApiProperty({
    description: '칭찬 보낸 사람',
    type: User,
  })
  sender: User;

  @ApiProperty({
    description: '총 받은 좋아요 수',
    type: Number,
  })
  likeCount: number;

  @ApiProperty({
    description: '내가 좋아요를 눌렀는지 여부 - 눌렀으면 1, 안 눌렀으면 0',
    type: Number,
  })
  likedByMe: number;
}

export class CardReadDTO {
  // is card read by receiver
  @ApiProperty({
    description: '칭찬 받은 사람이 칭찬을 읽었는지 여부',
    type: BooleanEnum,
    enum: BooleanEnum,
  })
  isCardReadByReceiver: BooleanEnum;

  // is comment read by sender
  @ApiProperty({
    description: '칭찬 보낸 사람이 칭찬에 달린 코멘트를 읽었는지 여부',
    type: BooleanEnum,
    enum: BooleanEnum,
  })
  isCommentReadBySender: BooleanEnum;
}
