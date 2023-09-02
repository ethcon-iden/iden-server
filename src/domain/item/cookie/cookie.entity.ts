import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { ItemName } from '../item.constant';

export enum CookieReason {
  /**************************************
   쿠키 적립 이유 (amounts > 0)
   **************************************/
  // 투표 참여
  VOTE = 'vote',

  POLL = 'poll',

  /**************************************
   쿠키 사용 이유 (amounts < 0)
   **************************************/
  // random 세 명의 투표에 내 이름 넣기
  INJECT_TO_RANDOM_FRIENDS = ItemName.INJECT_TO_RANDOM_FRIENDS,
  // 지정 한 명의 투표에 내 이름 넣기
  INJECT_TO_CERTAIN_FRIEND = ItemName.INJECT_TO_CERTAIN_FRIEND,
  // 나를 뽑은 사람 이름의 마지막 글자 보기
  REVEAL_LAST_CHARACTER = ItemName.REVEAL_LAST_CHARACTER,
}

@Entity()
export class Cookie extends BaseEntity {
  // db id
  @ApiProperty({
    example: 1,
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // cookie amount
  @ApiProperty({
    example: 100,
    description: '적립 / 사용한 쿠키 개수 - 적립은 양수, 사용은 음수',
  })
  @Column({ type: 'int' })
  amount: number;

  // user id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '유저 id',
  })
  @Column({ type: 'uuid' })
  userId: string;

  // user
  @ManyToOne(() => User, (user) => user.cookies, { onDelete: 'CASCADE' })
  user: User;

  // created at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '적립/사용일자',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // deleted at
  @ApiProperty({
    example: '2021-01-01 00:00:00',
    description: '삭제일자',
  })
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;

  // reason for cookie earning / spending
  @ApiProperty({
    example: CookieReason.VOTE,
    description: '적립/사용 이유',
    enum: CookieReason,
  })
  @Column({ type: 'enum', enum: CookieReason })
  reason: CookieReason;

  // reason id
  @ApiProperty({
    example: '1',
    description:
      '적립/사용 이유의 엔티티의 id - 투표 참여로 인한 적립시 CardBatch의 id',
  })
  @Column({ nullable: true })
  reasonId: string;
}
