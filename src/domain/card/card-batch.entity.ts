import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Card } from './card.entity';
import { User } from '../user/user.entity';

@Entity()
export class CardBatch extends BaseEntity {
  // db id
  @ApiProperty({
    example: '1',
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // user id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '유저 id',
  })
  @Column({ nullable: true })
  userId: string;

  // user
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // started at
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: '생성일',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  startedAt: Date;

  // ended at
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: '종료일',
  })
  @Column({ nullable: true, type: 'timestamptz' })
  endedAt: Date;

  // cards one to many
  @OneToMany(() => Card, (card) => card.cardBatch)
  cards: Card[];
}
