import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Card } from './card.entity';
import { User } from '../user/user.entity';

@Entity()
export class CardLike {
  // id
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

  @ManyToOne(() => Card, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardId' })
  card: Card;

  @ApiProperty({
    example: '68d49db3-1d75-4181-aa83-3c7638cbded9',
    description: '유저 id',
  })
  @Column({ nullable: true, type: 'uuid' })
  likerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'likerId' })
  liker: User;

  // created at
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: '생성일',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
