import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Card } from './card.entity';

@Entity()
export class Candidate extends BaseEntity {
  // db id
  @ApiProperty({
    example: '1',
    description: 'DB id',
  })
  @PrimaryGeneratedColumn('increment')
  id: number;

  // card id
  @ApiProperty({
    example: '1',
    description: '카드 id',
  })
  @Column({ type: 'int' })
  cardId: number;

  // card
  @ManyToOne(() => Card, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardId' })
  card: Card;

  // user id
  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '유저 id',
  })
  @Column({ nullable: true, type: 'uuid' })
  userId: string;

  // user
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
