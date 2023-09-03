import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardType } from './card-type.entity';
import { Candidate } from './candidate.entity';
import { CardBatch } from './card-batch.entity';
import { MaxLength } from 'class-validator';
import { User } from '../user/user.entity';
import { CardLike } from './card-like.entity';

@Entity()
export class Card extends BaseEntity {
  // id
  @ApiProperty({
    example: '1',
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // order: 1 ~ 12
  @ApiProperty({
    example: 1,
    description: '카드 순서',
  })
  @Column({ type: 'int' })
  order: number;

  // card batch id
  @ApiProperty({
    example: '1',
    description: '카드 배치 id',
  })
  @Column({ type: 'int' })
  cardBatchId: number;

  // card batch
  @ManyToOne(() => CardBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardBatchId' })
  cardBatch: CardBatch;

  // card type id
  @ApiProperty({
    example: '1',
    description: '카드 타입 id',
  })
  @Column({ type: 'int' })
  cardTypeId: number;

  // card type
  @ManyToOne(() => CardType)
  @JoinColumn({ name: 'cardTypeId' })
  cardType: CardType;

  // question
  @ApiProperty({
    example: '이 중에서 가장 잘 생긴 사람은?',
    description: '카드 질문',
  })
  @MaxLength(100)
  @Column({ type: 'varchar', length: 100, nullable: true })
  question: string;

  // emoji
  @ApiProperty({
    example: '👨‍🦰',
    description: '카드 이모지',
  })
  @Column({ nullable: true })
  emoji: string;

  // created at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '생성일',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // updated at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '수정일',
  })
  @UpdateDateColumn({ nullable: true, type: 'timestamptz' })
  updatedAt: Date;

  // answered at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '답변일',
  })
  @Column({ nullable: true, type: 'timestamptz' })
  votedAt: Date;

  // commented at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '답글 달린 일시',
  })
  @Column({ nullable: true, type: 'timestamptz' })
  commentedAt: Date;

  // feed sort 기준 시간
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '답변이 있는 경우 답변 작성일, 없는 경우 투표일 - feed 소팅용',
  })
  @Column({ type: 'timestamptz', nullable: true })
  commentedOrVotedAt: Date;

  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '칭찬을 보낸 user id',
  })
  @Column({ type: 'uuid', nullable: true })
  senderId: string;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '칭찬을 받은 user id',
  })
  @Column({ type: 'uuid', nullable: true })
  receiverId: string;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  // comment
  @ApiProperty({
    example: '칭찬 감사합니다.',
    description: '칭찬 받은 사람이 달 수 있는 코멘트',
  })
  @Column({ nullable: true })
  comment: string;

  // candidate reset count
  @ApiProperty({
    example: 0,
    description: '후보자 선택 초기화 횟수',
  })
  @Column({ type: 'int', default: 0 })
  candidateResetCount: number;

  // candidates OneToMany
  @OneToMany(() => Candidate, (candidate) => candidate.card)
  candidates: Candidate[];

  // 받은 라이크
  @OneToMany(() => CardLike, (cardLike) => cardLike.card)
  cardLikes: CardLike[];

  // isSpector
  @ApiProperty({
    example: false,
    description:
      '스펙터모드 여부 - OMG PASS 가 있는 경우 하루 세 번까지 사용 가능',
  })
  @Column({ type: 'boolean', default: false })
  isSpector: boolean;

  // revealed last character
  @ApiProperty({
    example: '호',
    description: '공개된 마지막 글자 - 공개되지 않은 경우 null',
  })
  @Index()
  @Column({ type: 'varchar', length: 1, nullable: true })
  revealedLastCharacter: string;

  // revealed full name
  @ApiProperty({
    example: '최용호',
    description: '공개된 이름 - 공개되지 않은 경우 null',
  })
  @Index()
  @Column({ type: 'varchar', length: 10, nullable: true })
  revealedFullName: string;

  // card read by receiver
  @ApiProperty({
    example: false,
    description: '카드 받은 사람이 카드 읽음 여부',
  })
  @Index()
  @Column({ type: 'boolean', default: false })
  isCardReadByReceiver: boolean;

  // comment read by sender
  @ApiProperty({
    example: false,
    description: '카드 보낸 사람이 답장 읽음 여부',
  })
  @Index()
  @Column({ type: 'boolean', default: false })
  isCommentReadBySender: boolean;
}
